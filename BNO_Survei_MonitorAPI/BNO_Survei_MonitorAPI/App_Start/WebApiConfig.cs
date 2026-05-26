using System.Web.Http;
using System.Web.Http.Cors;

namespace BNO_Survei_MonitorAPI
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
                // CORS — read origins from Web.config appSettings (CorsOrigins key)
            var origins = System.Configuration.ConfigurationManager.AppSettings["CorsOrigins"]
                ?? "http://localhost:5173";
                var cors = new EnableCorsAttribute(
                    origins: origins,
                    headers: "*",
                    methods: "*"
                );
            config.EnableCors(cors);

            // JWT auth filter applied globally
            config.Filters.Add(new Filters.JwtAuthFilter());

            // Web API routes
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );
        }
    }
}
