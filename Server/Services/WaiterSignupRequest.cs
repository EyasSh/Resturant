namespace Server.Services
{
    /// <summary>
    /// Request object for waiter signup.
    /// </summary>
    public class WaiterSignupRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        /// <summary>
        /// Initializes a new instance of the <see cref="WaiterSignupRequest"/> class with specified details.
        /// </summary>
        /// <param name="name">The name of the waiter.</param>
        /// <param name="email">The email address of the waiter.</param>
        /// <param name="password">The password for the waiter's account.</param>
        /// <param name="phone">The phone number of the waiter.</param>

        public WaiterSignupRequest(string name, string email, string password, string phone)
        {
            Name = name;
            Email = email;
            Password = password;
            Phone = phone;
        }
    }
}