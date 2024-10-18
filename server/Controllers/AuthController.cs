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
            Console.WriteLine($"Login attempt for user: {req.Username}");
            
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == req.Username);
            if (user == null)
            {
                return BadRequest("User not found.");
            }

            if (!_auth.VerifyPasswordHash(req.Password, user.PasswordHash, user.PasswordSalt))
            {
                return BadRequest("Wrong password.");
            }

            string token = _auth.CreateToken(user);

            var refreshToken = _auth.GenerateRefreshToken();
            _auth.SetRefreshToken(refreshToken, Response);

            return Ok(new { token = token, refreshToken = refreshToken.Token });
        }

        // RefreshToken class and GenerateRefreshToken method are now in AuthUtils
    }
}