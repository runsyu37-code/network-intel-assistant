using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Runtime.InteropServices;
using System.Web;

namespace BNO_Survei_MonitorAPI.ConnectDB
{
    public class ConnectionDB
    {
        public static SqlConnection con;
        public static string ConnectionStringCN /*เชื่อมต่อ Database : ITDev */
        {
            get
            {
                string strCon = "";

                if (System.Configuration.ConfigurationManager.ConnectionStrings["CN"] != null)
                {
                    strCon = System.Configuration.ConfigurationManager.ConnectionStrings["CN"].ConnectionString.ToString();
                }
                return strCon;

            }
        }
    }
}