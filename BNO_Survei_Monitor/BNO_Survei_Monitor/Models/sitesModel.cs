using System;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TestAPBNO_Survei_MonitorAPI.Models
{
    public class sitesModel
    {
        [JsonProperty(PropertyName = "Site_ID")]
        public string Site_ID { get; set; } 

        [JsonProperty(PropertyName = "name")]
        public string name { get; set; }

        [JsonProperty(PropertyName = "code")]
        public string code { get; set; }

        [JsonProperty(PropertyName = "location")]
        public string location { get; set; }

        [JsonProperty(PropertyName = "description")]
        public string description { get; set; }

        [JsonProperty(PropertyName = "created_at")]
        public string created_at { get; set; }

        [JsonProperty(PropertyName = "updated_at")]
        public string updated_at { get; set; }


    }
}