using System.Reflection;
using BookManager.Api.Data;
using BookManager.Api.Data.Seed;
using BookManager.Api.Infrastructure;
using BookManager.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

const string CorsPolicy = "frontend";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddScoped<IBookService, BookService>();

// Turn unhandled exceptions into a generic 500 ProblemDetails instead of leaking internals.
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Surface the XML /// summaries on controllers and DTOs in the Swagger UI.
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
        options.IncludeXmlComments(xmlPath);
});

builder.Services.AddCors(options =>
    options.AddPolicy(CorsPolicy, policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// Apply migrations and seed on startup.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await DataSeeder.SeedAsync(db);
}

app.UseExceptionHandler();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors(CorsPolicy);

app.MapControllers();

app.Run();

// Exposed so an integration/e2e harness could reference the entry point if needed.
public partial class Program { }
