using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.Tokens;
using server.Context;
using server.Models;
using server.Services;
using server.Utility;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Security.Cryptography;

namespace server.Controllers
{
    [Route("api")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuthUtils _auth;
        private readonly ApplicationContext _context;
        private readonly IUserService _userService;
        private readonly IConfiguration _config;

        public AuthController(ApplicationContext context, IConfiguration configuration, IUserService userService)
        {
            _context = context;
            _userService = userService;
            _auth = new AuthUtils(configuration);
            _config = configuration;
        }

        [HttpPost("login")]
        public async Task<ActionResult<object>> Login(UserDto req)
        {
            Console.WriteLine($"[{DateTime.UtcNow}] Login attempt started for email: {req.Email}");
            try
            {
                Console.WriteLine($"[{DateTime.UtcNow}] Attempting to find user in database");
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
                Console.WriteLine($"[{DateTime.UtcNow}] User found: {user != null}");

                if (user == null)
                {
                    Console.WriteLine($"[{DateTime.UtcNow}] Login failed: User not found for email {req.Email}");
                    return Unauthorized("Invalid email or password.");
                }

                Console.WriteLine($"[{DateTime.UtcNow}] Verifying password for user {user.Id}");
                if (!_auth.VerifyPasswordHash(req.Password, user.PasswordHash, user.PasswordSalt))
                {
                    Console.WriteLine($"[{DateTime.UtcNow}] Login failed: Invalid password for user {user.Id}");
                    return Unauthorized("Invalid email or password.");
                }

                Console.WriteLine($"[{DateTime.UtcNow}] Password verified for user {user.Id}");
                Console.WriteLine($"[{DateTime.UtcNow}] Starting JWT token creation for user {user.Id}");

                string token;
                try
                {
                    token = CreateToken(user);
                }
                catch (Exception tokenEx)
                {
                    Console.WriteLine($"[{DateTime.UtcNow}] Error creating JWT token: {tokenEx.Message}");
                    Console.WriteLine($"[{DateTime.UtcNow}] Token creation stack trace: {tokenEx.StackTrace}");
                    return StatusCode(500, "An error occurred during token creation.");
                }

                Console.WriteLine($"[{DateTime.UtcNow}] JWT token created for user {user.Id}");
                Console.WriteLine($"[{DateTime.UtcNow}] JWT token: {token}");

                RefreshToken refreshToken;
                try
                {
                    refreshToken = GenerateRefreshToken();
                }
                catch (Exception refreshEx)
                {
                    Console.WriteLine($"[{DateTime.UtcNow}] Error generating refresh token: {refreshEx.Message}");
                    Console.WriteLine($"[{DateTime.UtcNow}] Refresh token generation stack trace: {refreshEx.StackTrace}");
                    return StatusCode(500, "An error occurred during refresh token generation.");
                }

                Console.WriteLine($"[{DateTime.UtcNow}] Refresh token generated for user {user.Id}");
                Console.WriteLine($"[{DateTime.UtcNow}] Refresh token: {refreshToken.Token}");

                try
                {
                    SetRefreshToken(refreshToken, user);
                }
                catch (Exception setRefreshEx)
                {
                    Console.WriteLine($"[{DateTime.UtcNow}] Error setting refresh token: {setRefreshEx.Message}");
                    Console.WriteLine($"[{DateTime.UtcNow}] Set refresh token stack trace: {setRefreshEx.StackTrace}");
                    return StatusCode(500, "An error occurred while setting the refresh token.");
                }

                Console.WriteLine($"[{DateTime.UtcNow}] Refresh token set for user {user.Id}");

                Console.WriteLine($"[{DateTime.UtcNow}] Login successful for user {user.Id}");
                return Ok(new
                {
                    id = user.Id,
                    email = user.Email,
                    name = user.Name,
                    token = token,
                    refreshToken = refreshToken.Token
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[{DateTime.UtcNow}] Error during login process: {ex.Message}");
                Console.WriteLine($"[{DateTime.UtcNow}] Stack trace: {ex.StackTrace}");
                Console.WriteLine($"[{DateTime.UtcNow}] Detailed exception: {JsonSerializer.Serialize(ex)}");
                return StatusCode(500, "An error occurred during the login process.");
            }
        }

        private string CreateToken(User user)
        {
            Console.WriteLine($"[{DateTime.UtcNow}] Creating JWT token for user {user.Id}");
            try
            {
                List<Claim> claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Email),
                    new Claim(ClaimTypes.Role, user.Role)
                };

                Console.WriteLine($"[{DateTime.UtcNow}] Claims created: {JsonSerializer.Serialize(claims)}");

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                    _config.GetSection("AppSettings:Token").Value));

                Console.WriteLine($"[{DateTime.UtcNow}] Symmetric key created");

                var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

                Console.WriteLine($"[{DateTime.UtcNow}] Signing credentials created");

                var token = new JwtSecurityToken(
                    claims: claims,
                    expires: DateTime.Now.AddDays(1),
                    signingCredentials: creds);

                Console.WriteLine($"[{DateTime.UtcNow}] JWT token object created");

                var jwt = new JwtSecurityTokenHandler().WriteToken(token);

                Console.WriteLine($"[{DateTime.UtcNow}] JWT token string created");

                return jwt;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[{DateTime.UtcNow}] Error in CreateToken: {ex.Message}");
                Console.WriteLine($"[{DateTime.UtcNow}] CreateToken stack trace: {ex.StackTrace}");
                throw;
            }
        }