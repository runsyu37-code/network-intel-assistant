using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TestAPBNO_Survei_MonitorAPI.Models
{
    public class camerasModel
    {
        [JsonProperty(PropertyName = "id")]
        public int id { get; set; }

        [JsonProperty(PropertyName = "Site_ID")]
        public string Site_ID { get; set; }

        [JsonProperty(PropertyName = "Building_ID")]
        public string Building_ID { get; set; }

        [JsonProperty(PropertyName = "Floor_ID")]
        public string Floor_ID { get; set; }

        [JsonProperty(PropertyName = "device_name")]
        public string device_name { get; set; }

        [JsonProperty(PropertyName = "brand")]
        public string brand { get; set; }

        [JsonProperty(PropertyName = "model")]
        public string model { get; set; }

        [JsonProperty(PropertyName = "serial_no")]
        public string serial_no { get; set; }

        [JsonProperty(PropertyName = "mac_address")]
        public string mac_address { get; set; }

        [JsonProperty(PropertyName = "camera_type")]
        public string camera_type { get; set; }

        [JsonProperty(PropertyName = "resolution")]
        public string resolution { get; set; }

        [JsonProperty(PropertyName = "firmware_version")]
        public string firmware_version { get; set; }

        [JsonProperty(PropertyName = "ip_address")]
        public string ip_address { get; set; }

        [JsonProperty(PropertyName = "vlan_id")]
        public int? vlan_id { get; set; }

        [JsonProperty(PropertyName = "subnet_mask")]
        public string subnet_mask { get; set; }

        [JsonProperty(PropertyName = "gateway")]
        public string gateway { get; set; }

        [JsonProperty(PropertyName = "NVR_CH")]
        public string NVR_CH { get; set; }

        [JsonProperty(PropertyName = "SW_ID")]
        public string SW_ID { get; set; }

        [JsonProperty(PropertyName = "poe_port_number")]
        public int? poe_port_number { get; set; }

        [JsonProperty(PropertyName = "NVR_ID")]
        public string NVR_ID { get; set; }

        [JsonProperty(PropertyName = "nvr_channel")]
        public int? nvr_channel { get; set; }

        [JsonProperty(PropertyName = "install_location")]
        public string install_location { get; set; }

        [JsonProperty(PropertyName = "status")]
        public string status { get; set; }

        [JsonProperty(PropertyName = "fail_count")]
        public int? fail_count { get; set; }

        [JsonProperty(PropertyName = "last_seen")]
        public string last_seen { get; set; }

        [JsonProperty(PropertyName = "notes")]
        public string notes { get; set; }

        [JsonProperty(PropertyName = "created_at")]
        public string created_at { get; set; }

        [JsonProperty(PropertyName = "updated_at")]
        public string updated_at { get; set; }
    }
}
