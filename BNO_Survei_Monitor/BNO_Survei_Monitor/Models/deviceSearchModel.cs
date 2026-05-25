using Newtonsoft.Json;

namespace TestAPBNO_Survei_MonitorAPI.Models
{
    public class deviceSearchModel
    {
        [JsonProperty(PropertyName = "device_type")]
        public string device_type { get; set; }

        [JsonProperty(PropertyName = "device_id")]
        public string device_id { get; set; }

        [JsonProperty(PropertyName = "device_name")]
        public string device_name { get; set; }

        [JsonProperty(PropertyName = "ip_address")]
        public string ip_address { get; set; }

        [JsonProperty(PropertyName = "status")]
        public string status { get; set; }

        [JsonProperty(PropertyName = "Site_ID")]
        public string Site_ID { get; set; }

        [JsonProperty(PropertyName = "Building_ID")]
        public string Building_ID { get; set; }

        [JsonProperty(PropertyName = "Floor_ID")]
        public string Floor_ID { get; set; }

        [JsonProperty(PropertyName = "Rack_ID")]
        public string Rack_ID { get; set; }

        [JsonProperty(PropertyName = "brand")]
        public string brand { get; set; }

        [JsonProperty(PropertyName = "model")]
        public string model { get; set; }
    }
}
