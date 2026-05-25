using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TestAPBNO_Survei_MonitorAPI.Models
{
    public class roomsModel
    {
        [JsonProperty(PropertyName = "Room_ID")]
        public string Room_ID { get; set; }

        [JsonProperty(PropertyName = "Site_ID")]
        public string Site_ID { get; set; }

        [JsonProperty(PropertyName = "Building_ID")]
        public string Building_ID { get; set; }

        [JsonProperty(PropertyName = "Floor_ID")]
        public string Floor_ID { get; set; }

        [JsonProperty(PropertyName = "name")]
        public string name { get; set; }

        [JsonProperty(PropertyName = "type")]
        public string type { get; set; }

        [JsonProperty(PropertyName = "has_nvr")]
        public bool? has_nvr { get; set; }

        [JsonProperty(PropertyName = "has_sw")]
        public bool? has_sw { get; set; }

        [JsonProperty(PropertyName = "width_m")]
        public decimal? width_m { get; set; }

        [JsonProperty(PropertyName = "length_m")]
        public decimal? length_m { get; set; }

        [JsonProperty(PropertyName = "x")]
        public int? x { get; set; }

        [JsonProperty(PropertyName = "y")]
        public int? y { get; set; }

        [JsonProperty(PropertyName = "w")]
        public int? w { get; set; }

        [JsonProperty(PropertyName = "h")]
        public int? h { get; set; }

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
