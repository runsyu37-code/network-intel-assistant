using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;

namespace BNO_Survei_MonitorAPI.Filters
{
    /// <summary>
    /// Enforces role-based access control at the action level.
    /// Runs after JwtAuthFilter has validated the token and set RequestContext.Principal.
    /// Returns 403 Forbidden when the caller's role is not in the allowed list.
    ///
    /// Usage:
    ///   [RequireRole("admin")]                  — admin only
    ///   [RequireRole("admin", "user")]           — admin or user
    ///   [RequireRole("admin", "user", "viewer")] — any authenticated role
    /// </summary>
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
    public class RequireRoleAttribute : AuthorizationFilterAttribute
    {
        private readonly string[] _roles;

        public RequireRoleAttribute(params string[] roles)
        {
            if (roles == null || roles.Length == 0)
                throw new ArgumentException("At least one role must be specified.", nameof(roles));
            _roles = roles;
        }

        public override void OnAuthorization(HttpActionContext actionContext)
        {
            var principal = actionContext.RequestContext.Principal;

            if (principal == null || !principal.Identity.IsAuthenticated ||
                !_roles.Any(r => principal.IsInRole(r)))
            {
                actionContext.Response = actionContext.Request.CreateResponse(
                    HttpStatusCode.Forbidden,
                    new { Message = "Insufficient permissions" });
            }
        }
    }
}
