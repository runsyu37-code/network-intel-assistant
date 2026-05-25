using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TestAPBNO_Survei_MonitorAPI.Models
{
    public class floorsModel
    {
        [JsonProperty(PropertyName = "Floor_ID")]
        public string Floor_ID { get; set; }

        [JsonProperty(PropertyName = "Site_ID")]
        public string Site_ID { get; set; }

        [JsonProperty(PropertyName = "Building_ID")]
        public string Building_ID { get; set; }

        [JsonProperty(PropertyName = "floor_number")]
        public int? floor_number { get; set; }

        [JsonProperty(PropertyName = "name")]
        public string name { get; set; }

        [JsonProperty(PropertyName = "function")]
        public string function { get; set; }

        [JsonProperty(PropertyName = "has_cctv")]
        public bool? has_cctv { get; set; }

        [JsonProperty(PropertyName = "image_data")]
        public string image_data { get; set; }

        [JsonProperty(PropertyName = "image_type")]
        public string image_type { get; set; }

        [JsonProperty(PropertyName = "note")]
        public string note { get; set; }

        [JsonProperty(PropertyName = "created_at")]
        public string created_at { get; set; }

        [JsonProperty(PropertyName = "updated_at")]
        public string updated_at { get; set; }
    }
}
