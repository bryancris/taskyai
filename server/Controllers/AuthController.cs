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
            Console.WriteLine($"[{DateTime.UtcNow}] Request details: {JsonSerializer.Serialize(req, new JsonSerializerOptions { WriteIndented = true })}");
            
            try
            {
                Console.WriteLine($"[{DateTime.UtcNow}] Attempting to find user in database for email: {req.Email}");
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
                Console.WriteLine($"[{DateTime.UtcNow}] Database query completed. User found: {user != null}");
                if (user == null)
                {
                    Console.WriteLine($"[{DateTime.UtcNow}] User not found for email: {req.Email}");
                    return NotFound("User not found.");
                }

                Console.WriteLine($"[{DateTime.UtcNow}] User found for email: {req.Email}, verifying password");
                Console.WriteLine($"[{DateTime.UtcNow}] Password hash length: {user.PasswordHash?.Length}, Salt length: {user.PasswordSalt?.Length}");
                bool isPasswordValid = _auth.VerifyPasswordHash(req.Password, user.PasswordHash, user.PasswordSalt);
                Console.WriteLine($"[{DateTime.UtcNow}] Password verification result: {isPasswordValid}");
                if (!isPasswordValid)
                {
                    Console.WriteLine($"[{DateTime.UtcNow}] Invalid credentials for email: {req.Email}");
                    return Unauthorized("Invalid credentials.");
                }

                Console.WriteLine($"[{DateTime.UtcNow}] Password verified for email: {req.Email}, creating token");
                string token = _auth.CreateToken(user);
                Console.WriteLine($"[{DateTime.UtcNow}] Token created for email: {req.Email}, length: {token.Length}");

                Console.WriteLine($"[{DateTime.UtcNow}] Generating refresh token for email: {req.Email}");
                var refreshToken = _auth.GenerateRefreshToken();
                Console.WriteLine($"[{DateTime.UtcNow}] Refresh token generated for email: {req.Email}, length: {refreshToken.Token.Length}");

                Console.WriteLine($"[{DateTime.UtcNow}] Setting refresh token in response for email: {req.Email}");
                _auth.SetRefreshToken(refreshToken, Response);

                Console.WriteLine($"[{DateTime.UtcNow}] Preparing response object for email: {req.Email}");
                var response = new
                {
                    id = user.Id.ToString(),
                    email = user.Email,
                    name = user.Username,
                    token = token,
                    refreshToken = refreshToken.Token
                };

                Console.WriteLine($"[{DateTime.UtcNow}] Login successful for email: {req.Email}");
                Console.WriteLine($"[{DateTime.UtcNow}] Response prepared: {JsonSerializer.Serialize(response, new JsonSerializerOptions { WriteIndented = true, DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull })}");

                Console.WriteLine($"[{DateTime.UtcNow}] Returning Ok result for email: {req.Email}");
                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[{DateTime.UtcNow}] Error during login: {ex.Message}");
                Console.WriteLine($"[{DateTime.UtcNow}] Stack trace: {ex.StackTrace}");
                Console.WriteLine($"[{DateTime.UtcNow}] Exception type: {ex.GetType().FullName}");
                
                if (ex is DbUpdateException dbEx)
                {
                    Console.WriteLine($"[{DateTime.UtcNow}] Database error details:");
                    Console.WriteLine($"  Message: {dbEx.InnerException?.Message}");
                    Console.WriteLine($"  SQL: {dbEx.InnerException?.Data["Sql"]}");
                    Console.WriteLine($"  Params: {dbEx.InnerException?.Data["Params"]}");
                }

                if (ex is ArgumentNullException argNullEx)
                {
                    Console.WriteLine($"[{DateTime.UtcNow}] Argument null exception. Parameter name: {argNullEx.ParamName}");
                }
                
                Console.WriteLine($"[{DateTime.UtcNow}] Returning 500 Internal Server Error for login attempt");
                return StatusCode(500, new { error = "An error occurred during login. Please try again later.", details = ex.Message });
            }
        }