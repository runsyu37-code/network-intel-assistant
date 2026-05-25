using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TestAPBNO_Survei_MonitorAPI.Models
{
    public class alertLogsModel
    {
        [JsonProperty(PropertyName = "id")]
        public int id { get; set; }

        [JsonProperty(PropertyName = "device_type")]
        public string device_type { get; set; }

        [JsonProperty(PropertyName = "device_id")]
        public string device_id { get; set; }

        [JsonProperty(PropertyName = "device_name")]
        public string device_name { get; set; }

        [JsonProperty(PropertyName = "brand")]
        public string brand { get; set; }

        [JsonProperty(PropertyName = "ip_address")]
        public string ip_address { get; set; }

        [JsonProperty(PropertyName = "site_name")]
        public string site_name { get; set; }

        [JsonProperty(PropertyName = "building_name")]
        public string building_name { get; set; }

        [JsonProperty(PropertyName = "floor_name")]
        public string floor_name { get; set; }

        [JsonProperty(PropertyName = "room_name")]
        public string room_name { get; set; }

        [JsonProperty(PropertyName = "poe_switch_name")]
        public string poe_switch_name { get; set; }

        [JsonProperty(PropertyName = "poe_port")]
        public int? poe_port { get; set; }

        [JsonProperty(PropertyName = "alert_type")]
        public string alert_type { get; set; }

        [JsonProperty(PropertyName = "message")]
        public string message { get; set; }

        [JsonProperty(PropertyName = "webhook_sent")]
        public bool webhook_sent { get; set; }

        [JsonProperty(PropertyName = "resolved_at")]
        public string resolved_at { get; set; }

        [JsonProperty(PropertyName = "alerted_at")]
        public string alerted_at { get; set; }

        [JsonProperty(PropertyName = "updated_at")]
        public string updated_at { get; set; }
    }
}
