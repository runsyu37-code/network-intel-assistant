using BNO_Survei_MonitorAPI.Helpers;
using System;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Threading;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;

namespace BNO_Survei_MonitorAPI.Filters
{
    public class JwtAuthFilter : AuthorizationFilterAttribute
    {
        public override void OnAuthorization(HttpActionContext actionContext)
        {
            // Allow [AllowAnonymous] endpoints (e.g. login)
            if (actionContext.ActionDescriptor.GetCustomAttributes<System.Web.Http.AllowAnonymousAttribute>().Count > 0 ||
                actionContext.ControllerContext.ControllerDescriptor.GetCustomAttributes<System.Web.Http.AllowAnonymousAttribute>().Count > 0)
            {
                return;
            }

            // Handle OPTIONS preflight (CORS)
            if (actionContext.Request.Method == HttpMethod.Options)
                return;

            var authHeader = actionContext.Request.Headers.Authorization;
            if (authHeader == null || authHeader.Scheme != "Bearer" || string.IsNullOrEmpty(authHeader.Parameter))
            {
                actionContext.Response = actionContext.Request.CreateResponse(
                    HttpStatusCode.Unauthorized,
                    new { Message = "Missing or invalid Authorization header" }
                );
                return;
            }

            try
            {
                var principal = JwtHelper.ValidateToken(authHeader.Parameter);
                Thread.CurrentPrincipal = principal;
                actionContext.RequestContext.Principal = principal;
            }
            catch (Exception)
            {
                actionContext.Response = actionContext.Request.CreateResponse(
                    HttpStatusCode.Unauthorized,
                    new { Message = "Token invalid or expired" }
                );
            }
        }
    }
}
