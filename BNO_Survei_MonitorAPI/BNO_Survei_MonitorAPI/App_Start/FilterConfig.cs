using System.Web;
using System.Web.Mvc;

namespace BNO_Survei_MonitorAPI
{
    public class FilterConfig
    {
        public static void RegisterGlobalFilters(GlobalFilterCollection filters)
        {
            filters.Add(new HandleErrorAttribute());
        }
    }
}
