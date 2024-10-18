namespace server.Models
{
    public class UserDto
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Password { get; set; }

    }
}
