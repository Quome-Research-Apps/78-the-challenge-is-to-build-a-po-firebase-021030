# **App Name**: Civic Insights

## Core Features:

- Data Upload & Parsing: Accept a CSV or JSON file containing 311 service request data.
- Turnaround Time Analysis: Automatically calculates the time it takes to resolve each type of service request.
- Bottleneck Identification (AI-assisted): Analyzes the turnaround times and request types using an LLM tool to identify common causes for delay.
- Interactive Charting: Generates bar charts, pie charts, and timelines to visualize request volumes, resolution times, and trends.
- Geospatial Visualization: Integrate with a mapping library to plot service requests on a map, highlighting areas with high request density or slow response times.
- Filtering and Grouping: Allow users to filter the data by date range, request type, location, and other relevant fields, then group the results to explore trends.
- Stateless Operation: The application operates entirely in the browser, with no server-side data storage. All data is cleared when the browser tab is closed.

## Style Guidelines:

- Primary color: Navy blue (#3B5998) to convey trust, stability, and professionalism.
- Background color: Light gray (#F0F4F8) for a clean, uncluttered feel, ensuring readability.
- Accent color: Teal (#008080) to highlight interactive elements and key insights.
- Body and headline font: 'PT Sans', a humanist sans-serif for its blend of modern clarity and approachability.
- Use clear, minimalist icons from a library like Font Awesome to represent different types of service requests.
- Use a responsive, grid-based layout to ensure the application is usable on different screen sizes.
- Incorporate subtle transitions and animations to enhance user experience, like fading in charts or highlighting map markers.