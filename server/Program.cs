using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using Microsoft.OpenApi.Models;
using server.Context;
using server.Models;
using server.Services;
using Swashbuckle.AspNetCore.Filters;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Hosting;

namespace server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            Console.WriteLine("Starting the application...");
            var builder = WebApplication.CreateBuilder(args);
            Console.WriteLine($"Application started at: {DateTime.UtcNow}");
            // Set the HTTPS port
            builder.WebHost.UseUrls("https://localhost:7232");
            Console.WriteLine("Server configured to use HTTPS on port 7232");
            // Log the environment
Console.WriteLine($"Environment: {builder.Environment.EnvironmentName}\n");

            // Log the configuration sources
            Console.WriteLine("Configuration sources:");
((IConfigurationRoot)builder.Configuration).Providers.ToList().ForEach(provider => Console.WriteLine($" - {provider}"));

            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
            Console.WriteLine($"[{DateTime.UtcNow}] Connection string: {connectionString}");
            builder.Services.AddDbContext<ApplicationContext>(options =>
            {
                options.UseNpgsql(connectionString);
                options.LogTo(Console.WriteLine, LogLevel.Information);
                options.EnableSensitiveDataLogging();
                options.EnableDetailedErrors();
                options.UseLoggerFactory(LoggerFactory.Create(builder =>
                {
                    builder
                        .AddConsole()
                        .AddFilter(level => level >= LogLevel.Information);
                }));
            });
Console.WriteLine($"[{DateTime.UtcNow}] DbContext configured with connection string");

            // Test database connection
            try
            {
                var serviceProvider = builder.Services.BuildServiceProvider();
                using (var scope = serviceProvider.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<ApplicationContext>();
                    var canConnect = context.Database.CanConnect();
                    Console.WriteLine($"Database connection test result: {(canConnect ? "Success" : "Failure")}");
                    Console.WriteLine($"[{DateTime.UtcNow}] Database provider: {context.Database.ProviderName}");
                    if (!canConnect)
                    {
                        Console.WriteLine($"[{DateTime.UtcNow}] Failed to connect to the database. Please check your connection string and ensure the database server is running.");
                        throw new Exception("Failed to connect to the database.");
                    }
                    Console.WriteLine($"[{DateTime.UtcNow}] Successfully connected to the database.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error testing database connection: {ex.Message}");
                Console.WriteLine($"[{DateTime.UtcNow}] Exception details: {ex}");
                Console.WriteLine($"[{DateTime.UtcNow}] Inner exception: {ex.InnerException?.Message}");
                Console.WriteLine($"[{DateTime.UtcNow}] Stack trace: {ex.StackTrace}");
                throw;
            }

            // Add services to the container.

            builder.Services.AddControllers();
            builder.Services.AddControllers().AddJsonOptions(options =>
            {
                // options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.Preserve;
                options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
            });

            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8
                            .GetBytes(builder.Configuration.GetSection("AppSettings:Token").Value)),
                        ValidateIssuer = false,
                        ValidateAudience = false
                    };
                });

            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddHttpContextAccessor();
            builder.Services.AddSwaggerGen(options =>
            {
                options.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
                {
                    Description = "Standard Authorization header using the Bearer scheme (\"bearer {token}\")",
                    In = ParameterLocation.Header,
                    Name = "Authorization",
                    Type = SecuritySchemeType.ApiKey
                });

                options.OperationFilter<SecurityRequirementsOperationFilter>();
            });

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", builder =>
                {
                    builder
                           .AllowAnyOrigin()
                           .AllowAnyMethod()
                           .AllowAnyHeader()
                           .WithExposedHeaders("Content-Disposition");
                });
            });

            // Add logging middleware
            builder.Services.AddLogging(logging =>
            {
                logging.AddConfiguration(builder.Configuration.GetSection("Logging"));
                logging.AddConsole();
                logging.AddDebug();
            });

            // Enable detailed error messages
            builder.Services.AddProblemDetails();

            builder.Services.Configure<ApiBehaviorOptions>(options =>
            {
                options.SuppressModelStateInvalidFilter = true;
            });

Console.WriteLine($"[{DateTime.UtcNow}] Building the application");
            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseSwagger();
                Console.WriteLine($"[{DateTime.UtcNow}] Swagger enabled for development environment");
                app.UseSwaggerUI();
            }
            else
            {
                app.UseExceptionHandler(errorApp =>
                {
                    errorApp.Run(async context =>
                    {
                        context.Response.StatusCode = 500;
                        context.Response.ContentType = "application/json";
                        var error = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
                        if (error != null)
                            await context.Response.WriteAsync($"{{\"error\": \"{error.Error.Message}\", \"stackTrace\": \"{error.Error.StackTrace}\"}}");
                    });
                });
            }

            // Add CORS middleware before routing
            app.UseCors("AllowAll");
            Console.WriteLine($"[{DateTime.UtcNow}] CORS middleware added");

            // Add middleware to log all requests
            app.Use(async (context, next) =>
            {
                Console.WriteLine($"[{DateTime.UtcNow}] Request started: {context.Request.Method} {context.Request.Path}");
                Console.WriteLine($"[{DateTime.UtcNow}] Incoming request: {context.Request.Method} {context.Request.Scheme}://{context.Request.Host}{context.Request.Path}{context.Request.QueryString}");
                Console.WriteLine($"Request headers: {string.Join("\n", context.Request.Headers.Select(h => $"{h.Key}: {string.Join(", ", h.Value)}"))}");
                
                // Log request body for POST requests
                if (context.Request.Method == "POST" && context.Request.ContentType != null && context.Request.ContentType.StartsWith("application/json"))
                {
                    context.Request.EnableBuffering();
                    var body = await new StreamReader(context.Request.Body).ReadToEndAsync();
                    Console.WriteLine($"Request body (raw): {body}");
                    try
                    {
                        var jsonBody = System.Text.Json.JsonSerializer.Deserialize<object>(body);
                        Console.WriteLine($"Request body (parsed): {System.Text.Json.JsonSerializer.Serialize(jsonBody, new System.Text.Json.JsonSerializerOptions { WriteIndented = true })}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Failed to parse request body as JSON: {ex.Message}");
                    }
                    context.Request.Body.Position = 0;
                }

                try
                {
                    Console.WriteLine($"[{DateTime.UtcNow}] Executing request pipeline for {context.Request.Method} {context.Request.Path}");
                    Console.WriteLine($"[{DateTime.UtcNow}] Executing request pipeline");
                    await next.Invoke();
                    Console.WriteLine($"[{DateTime.UtcNow}] Request pipeline completed successfully");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[{DateTime.UtcNow}] Unhandled exception in global error handler:");
                    Console.WriteLine($"Exception Message: {ex.Message}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace ?? "No stack trace available"}");
                    Console.WriteLine($"Exception type: {ex.GetType().FullName}");
                    Console.WriteLine($"Inner exception: {ex.InnerException?.Message ?? "No inner exception"}");
                    
                    if (ex is DbUpdateException dbEx)
                    {
                        Console.WriteLine($"Database error details:");
                        Console.WriteLine($"  Message: {dbEx.InnerException?.Message}");
                        Console.WriteLine($"  SQL: {dbEx.InnerException?.Data["Sql"]}");
                        Console.WriteLine($"  Params: {dbEx.InnerException?.Data["Params"]}");
                    }
                    
                    if (ex is NpgsqlException pgEx)
                    {
                        Console.WriteLine($"PostgreSQL error details:");
                        Console.WriteLine($"  Error code: {pgEx.SqlState}");
                        Console.WriteLine($"  Error message: {pgEx.Message}");
                        Console.WriteLine($"  InnerException: {pgEx.InnerException?.Message ?? "No inner exception"}");
                    }

                    // Log database connection state
                    using (var scope = app.Services.CreateScope())
                    {
                        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationContext>();
                        Console.WriteLine($"Database connection state: {dbContext.Database.GetConnectionString()}");
                        Console.WriteLine($"Can connect to database: {dbContext.Database.CanConnect()}");
                        Console.WriteLine($"Database provider: {dbContext.Database.ProviderName}");
                    }
                    
                    context.Response.StatusCode = 500;
                    await context.Response.WriteAsJsonAsync(new { message = "An unexpected error occurred. Please try again later.", error = ex.Message, stackTrace = ex.StackTrace, innerException = ex.InnerException?.Message });
                }
                finally
                {
                    Console.WriteLine($"[{DateTime.UtcNow}] Response: Status code: {context.Response.StatusCode}, Content-Type: {context.Response.ContentType}, Content-Length: {context.Response.ContentLength}");
                    if (context.Response.StatusCode == 500)
                    {
                        Console.WriteLine($"[{DateTime.UtcNow}] 500 Internal Server Error occurred. Request path: {context.Request.Path}, Method: {context.Request.Method}");
                        Console.WriteLine($"Response body: {await GetResponseBody(context.Response)}");
                    }

                    // Log all response headers
                    Console.WriteLine("Response headers:");
                    foreach (var header in context.Response.Headers)
                    {
                        Console.WriteLine($"{header.Key}: {string.Join(", ", header.Value)}");
                    }

                    Console.WriteLine($"[{DateTime.UtcNow}] Request completed: {context.Request.Method} {context.Request.Path}");
                }
            });

            // Add global exception handler
            app.Use(async (context, next) =>
            {
                await next.Invoke();
                Console.WriteLine($"[{DateTime.UtcNow}] Request completed. Method: {context.Request.Method}, Path: {context.Request.Path}, Status code: {context.Response.StatusCode}");
            });

            // Force HTTPS redirection
            app.UseHttpsRedirection();
            Console.WriteLine("HTTPS redirection enabled");

            app.UseRouting();
            app.UseAuthentication();
            app.UseAuthorization();
            app.MapControllers();

            Console.WriteLine($"Application configured at: {DateTime.UtcNow}. Starting to listen for requests...");
            Console.WriteLine($"[{DateTime.UtcNow}] Application startup complete. Listening for requests...");
            app.Run();
        }

        private static async Task<string> GetResponseBody(HttpResponse response)
        {
            response.Body.Seek(0, SeekOrigin.Begin);
            var text = await new StreamReader(response.Body).ReadToEndAsync();
            response.Body.Seek(0, SeekOrigin.Begin);
            return text;
        }
    }
}