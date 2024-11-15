var PRIVATE_KEY = "pk_a3770c421009d0fbecff243aa4c9eca3dc";

// Array to store the timestamps of recent requests
var requestTimestamps = [];


// Function to get configuration
function getConfig(request) {
  var cc = DataStudioApp.createCommunityConnector();
  var config = cc.getConfig();
  config
    .newTextInput()
    .setId('PRIVATE_KEY')
    .setName('Enter your Klaviyo private api key')
    .setHelpText('e.g. "pk_a876hjuytt87654"')
    .setPlaceholder(PRIVATE_KEY)
    .setAllowOverride(true);

  config.setDateRangeRequired(true);

  return config.build();
}

// Schema definition
var Schema = [
  { name: 'name', label: 'Name', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'ID', label: 'ID', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'types', label: 'Types', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'revenue_per_recipient', label: 'Revenue Per Recipient', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'clicks_unique', label: 'Unique Clicks', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'opens', label: 'Opens', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'open_rate', label: 'Open Rate', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'click_rate', label: 'Click Rate', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'conversion_value', label: 'Conversion Value', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'unsubscribe_rate', label: 'Unsubscribe Rate', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } }
];

// Function to get schema
function getSchema(request) {
  return { schema: Schema };
}

// Helper function to fetch data from an API
function fetchData(url, method) {
  var requestOptions = {
    method: method,
    headers: {
      revision: "2024-07-15",
      Accept: "application/json",
      Authorization: "Klaviyo-API-Key " + PRIVATE_KEY
    },
    muteHttpExceptions: true
  };
  var response = UrlFetchApp.fetch(url, requestOptions);
  return JSON.parse(response.getContentText()).data;
}


// Helper function to track and throttle requests based on rate limits
function throttleRequests() {
  var now = new Date().getTime();

  // Remove timestamps older than 1 minute from the array
  requestTimestamps = requestTimestamps.filter(function (timestamp) {
    return now - timestamp < 60000;
  });

  // If the number of requests in the last second exceeds 10, wait until it's safe to make another request
  if (requestTimestamps.length >= 10 && now - requestTimestamps[requestTimestamps.length - 10] < 1000) {
    var delay = 1000 - (now - requestTimestamps[requestTimestamps.length - 10]);
    Utilities.sleep(delay);
  }

  // If the number of requests in the last minute exceeds 150, wait until it's safe to make another request
  if (requestTimestamps.length >= 150 && now - requestTimestamps[requestTimestamps.length - 150] < 60000) {
    var delay = 60000 - (now - requestTimestamps[requestTimestamps.length - 150]);
    Utilities.sleep(delay);
  }

  // Log the current timestamp as a request made
  requestTimestamps.push(now);
}

// Helper function to fetch details with delay and rate limiting
function fetchDataDetailsWithDelay(type, itemID) {
  var url = type === 'campaign'
    ? "https://a.klaviyo.com/api/campaign-values-reports/"
    : "https://a.klaviyo.com/api/flow-values-reports/";

  const raw = JSON.stringify({
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
          ? "and(equals(campaign_id,'" + itemID + "'))"
          : "and(equals(flow_id,'" + itemID + "'))"
      }
    }
  });

  const requestOptions = {
    method: "POST",
    headers: {
      revision: "2024-07-15",
      Accept: "application/json",
      Authorization: "Klaviyo-API-Key " + PRIVATE_KEY
    },
    body: raw,
    muteHttpExceptions: true
  };

  // Throttle requests before making the API call
  throttleRequests();

  // Make the request after rate limiting is checked
  var response = UrlFetchApp.fetch(url, requestOptions);
  console.log(response.getResponseCode(), response.getContentText());
  return JSON.parse(response.getContentText()).data;
}

// Function to convert data to rows
function dataToRow(type, data, request) {
  var rows = [];
  data.forEach(function (item) {
    var row = [];
    request.fields.forEach(function (field) {
      switch (field.name) {
        case 'types':
          row.push(type);
          break;
        case 'name':
          row.push(item.attributes.name);
          break;
        case 'ID':
          row.push(item.id);
          break;
        case 'revenue_per_recipient':
        case 'clicks_unique':
        case 'opens':
        case 'open_rate':
        case 'click_rate':
        case 'conversion_value':
        case 'unsubscribe_rate':
          row.push(item.statistics && item.statistics[field.name] !== undefined ? item.statistics[field.name] : 'no data');
          break;
        default:
          row.push('');
      }
    });
    rows.push({ values: row });
  });
  return rows;
}

function getAllDataFromAPI(request) {
  var campaignsUrl = "https://a.klaviyo.com/api/campaigns/?filter=equals(messages.channel,'email')";
  var flowsUrl = "https://a.klaviyo.com/api/flows/";

  // Fetch campaigns and flows data
  var campaignsData = fetchData(campaignsUrl, "GET");
  var flowsData = fetchData(flowsUrl, "GET");

  if (campaignsData) {
    campaignsData.forEach(function (item) {
      var itemData = fetchDataDetailsWithDelay('campaign', item.id);
      if (itemData) {
        item.statistics = itemData.attributes.results.statistics;
      }
    });
  }

  if (flowsData) {
    flowsData.forEach(function (item) {
      var itemData = fetchDataDetailsWithDelay('flow', item.id);
      if (itemData) {
        item.statistics = itemData.attributes.results.statistics;
      }
    });
  }

  return {
    campaignsData: campaignsData,
    flowsData: flowsData
  };
}

// Function to get data
function getData(request) {
  var allData = getAllDataFromAPI(request);

  // Prepare data schema
  var dataSchema = Schema.filter(function (field) {
    return request.fields.some(function (reqField) {
      return field.name === reqField.name;
    });
  });

  // Convert data to rows
  var campaignRows = dataToRow("campaign", allData.campaignsData, request);
  var flowRows = dataToRow("flow", allData.flowsData, request);

  // Combine rows
  var rows = campaignRows.concat(flowRows);

  return {
    schema: dataSchema,
    rows: rows
  };
}

// Function to get authentication type
function getAuthType() {
  return { type: "NONE" };
}
