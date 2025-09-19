set -e

app_spec=$(cat "./app_spec.json" | jq --arg img_tag "$TAG" '.spec.containers[0].image = $img_tag')

RESPONSE=$(curl -L -s -m 30 -w "\nStatus Code: %{http_code}\n" -X PUT \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer $API_KEY" \
	-d "$app_spec" \
	"https://demo.quome.cloud/api/v1/orgs/$ORG_ID/apps/$APP_ID")

CURL_EXIT_CODE=$?

# Extract the HTTP status code
HTTP_STATUS=$(echo "$RESPONSE" | grep "Status Code:" | awk '{print $3}')

if [[ "$HTTP_STATUS" -ge 200 && "$HTTP_STATUS" -lt 300 ]]; then
	echo -e "Cloud deployment update initiated successfully! (HTTP $HTTP_STATUS)"
else
	echo -e "Request did not succeed. Details:"

	# Classify the error for better debugging
	if [[ "$CURL_EXIT_CODE" -ne 0 ]]; then
		echo -e "curl command failed with exit code $CURL_EXIT_CODE"
	elif [[ "$HTTP_STATUS" -eq 401 || "$HTTP_STATUS" -eq 403 ]]; then
		echo -e "Authentication error (HTTP $HTTP_STATUS). Please check your API key."
	elif [[ "$HTTP_STATUS" -eq 404 ]]; then
		echo -e "Resource not found (HTTP $HTTP_STATUS). Incorrect API URL or App/Org ID."
	elif [[ "$HTTP_STATUS" -eq 400 ]]; then
		echo -e "Bad request (HTTP $HTTP_STATUS). Likely an issue with the payload format."
		echo "API Response:"
		echo "$RESPONSE"
	elif [[ "$HTTP_STATUS" -eq 0 ]]; then
		echo -e "No HTTP status received. Connection problem or timeout."
	else
		echo -e "Unexpected HTTP status: $HTTP_STATUS"
	fi
	exit 1
fi
