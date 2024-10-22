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
                Console.WriteLine($"[{DateTime.UtcNow}] Database query completed. User found: {user != null}");

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
                string token = CreateToken(user);

                Console.WriteLine($"[{DateTime.UtcNow}] JWT token created for user {user.Id}");

                var refreshToken = GenerateRefreshToken();
                SetRefreshToken(refreshToken, user);

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
                return StatusCode(500, new { error = "An error occurred during the login process.", details = ex.Message });
            }
        }

        private string CreateToken(User user)
        {
            List<Claim> claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _config.GetSection("AppSettings:Token").Value));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.Now.AddDays(1),
                signingCredentials: creds);

            var jwt = new JwtSecurityTokenHandler().WriteToken(token);

            return jwt;
        }
    }
}