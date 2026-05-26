using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TestAPBNO_Survei_MonitorAPI.Models
{
    public class usersModel
    {
        [JsonProperty(PropertyName = "User_ID")]
        public int User_ID { get; set; }

        [JsonProperty(PropertyName = "username")]
        public string username { get; set; }

        [JsonProperty(PropertyName = "pw_hash")]
        public string pw_hash { get; set; }

        [JsonProperty(PropertyName = "password")]
        public string password { get; set; }

        [JsonProperty(PropertyName = "display_name")]
        public string display_name { get; set; }

        [JsonProperty(PropertyName = "role")]
        public string role { get; set; }

        [JsonProperty(PropertyName = "is_active")]
        public bool is_active { get; set; }

        [JsonProperty(PropertyName = "last_login")]
        public string last_login { get; set; }

        [JsonProperty(PropertyName = "created_at")]
        public string created_at { get; set; }

        [JsonProperty(PropertyName = "updated_at")]
        public string updated_at { get; set; }
    }
}
