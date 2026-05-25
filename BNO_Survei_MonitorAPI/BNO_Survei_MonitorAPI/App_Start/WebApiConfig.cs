using System.Web.Http;
using System.Web.Http.Cors;

namespace BNO_Survei_MonitorAPI
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            // CORS — allow React dev server + production intranet origin
            var cors = new EnableCorsAttribute(
                origins: "http://localhost:5173,http://localhost:3000,http://localhost:5174",
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
