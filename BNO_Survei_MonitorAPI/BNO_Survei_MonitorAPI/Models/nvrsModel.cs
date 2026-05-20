using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TestAPBNO_Survei_MonitorAPI.Models
{
    public class nvrsModel
    {
        [JsonProperty(PropertyName = "NVR_ID")]
        public string NVR_ID { get; set; }

        [JsonProperty(PropertyName = "Site_ID")]
        public string Site_ID { get; set; }

        [JsonProperty(PropertyName = "Building_ID")]
        public string Building_ID { get; set; }

        [JsonProperty(PropertyName = "Floor_ID")]
        public string Floor_ID { get; set; }

        [JsonProperty(PropertyName = "Room_ID")]
        public string Room_ID { get; set; }

        [JsonProperty(PropertyName = "Rack_ID")]
        public string Rack_ID { get; set; }

        [JsonProperty(PropertyName = "u_position")]
        public int? u_position { get; set; }

        [JsonProperty(PropertyName = "u_subposition")]
        public int? u_subposition { get; set; }

        [JsonProperty(PropertyName = "u_size")]
        public int? u_size { get; set; }

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

        [JsonProperty(PropertyName = "os_version")]
        public string os_version { get; set; }

        [JsonProperty(PropertyName = "ip_internet")]
        public string ip_internet { get; set; }

        [JsonProperty(PropertyName = "ip_cctv")]
        public string ip_cctv { get; set; }

        [JsonProperty(PropertyName = "vlan_id")]
        public int? vlan_id { get; set; }

        [JsonProperty(PropertyName = "subnet_mask")]
        public string subnet_mask { get; set; }

        [JsonProperty(PropertyName = "gateway")]
        public string gateway { get; set; }

        [JsonProperty(PropertyName = "total_channels")]
        public int? total_channels { get; set; }

        [JsonProperty(PropertyName = "active_channels")]
        public int? active_channels { get; set; }

        [JsonProperty(PropertyName = "hdd_total_tb")]
        public decimal? hdd_total_tb { get; set; }

        [JsonProperty(PropertyName = "hdd_used_pct")]
        public decimal? hdd_used_pct { get; set; }

        [JsonProperty(PropertyName = "recording_res")]
        public string recording_res { get; set; }

        [JsonProperty(PropertyName = "retention_days")]
        public int? retention_days { get; set; }

        [JsonProperty(PropertyName = "record_status")]
        public string record_status { get; set; }

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
