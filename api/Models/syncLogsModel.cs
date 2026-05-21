using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TestAPBNO_Survei_MonitorAPI.Models
{
    public class syncLogsModel
    {
        [JsonProperty(PropertyName = "id")]
        public int id { get; set; }

        [JsonProperty(PropertyName = "device_type")]
        public string device_type { get; set; }

        [JsonProperty(PropertyName = "device_id")]
        public string device_id { get; set; }

        [JsonProperty(PropertyName = "synced_by")]
        public int? synced_by { get; set; }

        [JsonProperty(PropertyName = "sync_type")]
        public string sync_type { get; set; }

        [JsonProperty(PropertyName = "fields_updated")]
        public string fields_updated { get; set; }

        [JsonProperty(PropertyName = "status")]
        public string status { get; set; }

        [JsonProperty(PropertyName = "message")]
        public string message { get; set; }

        [JsonProperty(PropertyName = "created_at")]
        public string created_at { get; set; }
    }
}
