using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TestAPBNO_Survei_MonitorAPI.Models
{
    public class racksModel
    {
        [JsonProperty(PropertyName = "Rack_ID")]
        public string Rack_ID { get; set; }

        [JsonProperty(PropertyName = "Site_ID")]
        public string Site_ID { get; set; }

        [JsonProperty(PropertyName = "Building_ID")]
        public string Building_ID { get; set; }

        [JsonProperty(PropertyName = "Floor_ID")]
        public string Floor_ID { get; set; }

        [JsonProperty(PropertyName = "Room_ID")]
        public string Room_ID { get; set; }

        [JsonProperty(PropertyName = "name")]
        public string name { get; set; }

        [JsonProperty(PropertyName = "total_units")]
        public int total_units { get; set; }

        [JsonProperty(PropertyName = "units_per_u")]
        public int units_per_u { get; set; }

        [JsonProperty(PropertyName = "brand")]
        public string brand { get; set; }

        [JsonProperty(PropertyName = "model")]
        public string model { get; set; }

        [JsonProperty(PropertyName = "max_power_w")]
        public int? max_power_w { get; set; }

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
