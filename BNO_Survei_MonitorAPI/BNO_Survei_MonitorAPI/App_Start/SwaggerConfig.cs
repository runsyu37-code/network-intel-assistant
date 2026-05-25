using Swashbuckle.Application;
using System.Web.Http;
using WebActivatorEx;

[assembly: PreApplicationStartMethod(typeof(BNO_Survei_MonitorAPI.SwaggerConfig), "Register")]

namespace BNO_Survei_MonitorAPI
{
    public class SwaggerConfig
    {
        public static void Register()
        {
            GlobalConfiguration.Configuration.EnableSwagger(c =>
            {
                c.SingleApiVersion("v1", "SSM Surveillance Monitor API");
                c.IncludeXmlComments(GetXmlCommentsPath());
            })
            .EnableSwaggerUi();
        }

        private static string GetXmlCommentsPath()
        {
            return System.String.Format(
                @"{0}\bin\BNO_Survei_MonitorAPI.xml",
                System.AppDomain.CurrentDomain.BaseDirectory
            );
        }
    }
}
