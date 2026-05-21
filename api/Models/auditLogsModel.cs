using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TestAPBNO_Survei_MonitorAPI.Models
{
    public class auditLogsModel
    {
        [JsonProperty(PropertyName = "id")]
        public int id { get; set; }

        [JsonProperty(PropertyName = "user_id")]
        public int? user_id { get; set; }

        [JsonProperty(PropertyName = "action")]
        public string action { get; set; }

        [JsonProperty(PropertyName = "table_name")]
        public string table_name { get; set; }

        [JsonProperty(PropertyName = "record_id")]
        public string record_id { get; set; }

        [JsonProperty(PropertyName = "old_value")]
        public string old_value { get; set; }

        [JsonProperty(PropertyName = "new_value")]
        public string new_value { get; set; }

        [JsonProperty(PropertyName = "created_at")]
        public string created_at { get; set; }
    }
}
