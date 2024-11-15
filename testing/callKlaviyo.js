const axios = require('axios');
const fs = require('fs');

const PRIVATE_KEY = "pk_a3770c421009d0fbecff243aa4c9eca3dc";

const headers = {
  'revision': "2024-07-15",
  'Accept': "application/json",
  'Authorization': "Klaviyo-API-Key " + PRIVATE_KEY
};

// Function to fetch data from an API
async function fetchData(url, method, data = null) {
  try {
    const response = await axios({
      url: url,
      method: method,
      headers: headers,
      data: data
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error.response ? error.response.data : error.message);
    return null;
  }
}

// Helper function to fetch details with delay
async function fetchDataDetailsWithDelay(type, itemID) {
  await new Promise(resolve => setTimeout(resolve, 30000)); // Add a delay to prevent hitting rate limits
  const url = type === 'campaign'
    ? "https://a.klaviyo.com/api/campaign-values-reports/"
    : "https://a.klaviyo.com/api/flow-values-reports/";

  const data = {
    "data": {
      "type": type === 'campaign' ? "campaign-values-report" : "flow-values-report",
      "attributes": {
        "statistics": [
          "revenue_per_recipient",
          "clicks_unique",
          "opens",
          "open_rate",
          "click_rate",
          "conversion_value",
          "unsubscribe_rate"
        ],
        "timeframe": {
          "key": "last_30_days"
        },
        "conversion_metric_id": "VHtm5r",
        "filter": type === 'campaign'
          ? `and(equals(campaign_id,'${itemID}'))`
          : `and(equals(flow_id,'${itemID}'))`
      }
    }
  };

  return fetchData(url, "POST", data);
}

// Function to get all data from API
async function getAllDataFromAPI() {
  const campaignsUrl = "https://a.klaviyo.com/api/campaigns/?filter=equals(messages.channel,'email')";
  const flowsUrl = "https://a.klaviyo.com/api/flows/";

  // Fetch campaigns and flows data
  const campaignsData = await fetchData(campaignsUrl, "GET");
  const flowsData = await fetchData(flowsUrl, "GET");

  // if (campaignsData) {
  //   for (const item of campaignsData) {
  //     const itemData = await fetchDataDetailsWithDelay('campaign', item.id);
  //     if (itemData) {
  //       item.statistics = itemData.attributes.results.statistics;
  //     }
  //   }
  // }

  if (flowsData) {
    for (const item of flowsData) {
      const itemData = await fetchDataDetailsWithDelay('flow', item.id);
      if (itemData) {
        item.statistics = itemData.attributes.results.statistics;
      }
    }
  }

  return {
    campaignsData: campaignsData,
    flowsData: flowsData
  };
}

// Main function to fetch data and write to JSON file
async function main() {
  const allData = await getAllDataFromAPI();
  fs.writeFileSync('klaviyoData.json', JSON.stringify(allData, null, 2), 'utf-8');
  console.log('Data has been written to klaviyoData.json');
}

// Run the main function
main();