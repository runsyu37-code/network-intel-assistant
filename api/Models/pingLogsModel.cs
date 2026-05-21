using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TestAPBNO_Survei_MonitorAPI.Models
{
    public class pingLogsModel
    {
        [JsonProperty(PropertyName = "id")]
        public int id { get; set; }

        [JsonProperty(PropertyName = "device_type")]
        public string device_type { get; set; }

        [JsonProperty(PropertyName = "device_id")]
        public string device_id { get; set; }

        [JsonProperty(PropertyName = "ip_address")]
        public string ip_address { get; set; }

        [JsonProperty(PropertyName = "is_alive")]
        public bool is_alive { get; set; }

        [JsonProperty(PropertyName = "latency_ms")]
        public decimal? latency_ms { get; set; }

        [JsonProperty(PropertyName = "pinged_at")]
        public string pinged_at { get; set; }
    }
}
