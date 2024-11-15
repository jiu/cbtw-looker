var PRIVATE_KEY = "pk_a3770c421009d0fbecff243aa4c9eca3dc";

// Function to get configuration
function getConfig(request) {
  return { configParams: [] };
}

// Schema definition
var Schema = [
  { name: 'name', label: 'name', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'ID', label: 'ID', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'types', label: 'Types', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } }
];

// Function to get schema
function getSchema(request) {
  return { schema: Schema };
}

// Helper function to fetch data from an API
function fetchData(url, requestOptions) {
  var response = UrlFetchApp.fetch(url, requestOptions);
  return JSON.parse(response.getContentText()).data;
}

// Function to convert data to rows
function dataToRow(type, data, requestFields) {
  var rows = [];
  data.forEach(function(item) {
    var row = [];
    requestFields.forEach(function(field) {
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
        default:
          row.push('');
      }
    });
    rows.push({ values: row });
  });
  return rows;
}

// Function to get data
function getData(request) {
  var campaignsUrl = "https://a.klaviyo.com/api/campaigns/?filter=equals(messages.channel,'email')";
  var flowsUrl = "https://a.klaviyo.com/api/flows/";

  var requestOptions = {
    method: "GET",
    headers: {
        revision: "2024-07-15",
      Accept: "application/json",
      Authorization: "Klaviyo-API-Key " + PRIVATE_KEY
    },
    redirect: "follow"
  };

  // Fetch campaigns and flows data
  var campaignsData = fetchData(campaignsUrl, requestOptions);
  var flowsData = fetchData(flowsUrl, requestOptions);

  // Prepare data schema
  var dataSchema = Schema.filter(function(field) {
    return request.fields.some(function(reqField) {
      return field.name === reqField.name;
    });
  });

  // Convert data to rows
  var campaignRows = dataToRow("campaign", campaignsData, request.fields);
  var flowRows = dataToRow("flow", flowsData, request.fields);

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
