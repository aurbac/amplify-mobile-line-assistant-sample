# Getting Started with Amplify Mobile Line Assistant

This tutorial guides you through the process of setting up a React front-end application using AWS Amplify that integrates with Amazon Bedrock, a machine learning service for building conversational AI experiences. The application leverages Amazon Cognito for user authentication and authorization. 

By the end of this tutorial, you'll have a fully functional web application that allows users to interact with a conversational AI agent for mobile line assistance.

## Prerequisites

- [Install and configure the Amplify CLI](https://docs.amplify.aws/gen1/react/tools/cli/start/set-up-cli/)

```console
npm install -g @aws-amplify/cli 
```

## Deployment

Run the following commands in the React front-end application.

### Install React application dependencies

```console
npm install
```

### Initialize the Amplify application

```console
amplify init
```

- To initialize the project use the **suggested confgiration**.
- Select your authentication method.

### Add Authentication

```console
amplify add auth
```
Use the following configuration:
 - Do you want to use the default authentication and security configuration? **Default configuration**
 - How do you want users to be able to sign in? **Phone Number**
 - Do you want to configure advanced settings? **No, I am done.**


```console
amplify push
```

### Configure the Amazon Bedrock Agent

Rename the file **src/sample.env.js** to **src/env.js** and update the values with your **Agent** ID and **Agent Alias ID**.

### Update the Auth Role from Amazon Cognito Identity Pool

Add the following inline policy to the **authRole**:

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "InvokeBedrockAgent",
			"Effect": "Allow",
			"Action": "bedrock:InvokeAgent",
			"Resource": "*"
		}
	]
}
```

### Add Hosting and testing

```console
amplify add hosting
```

Use the following configuration:
- Select the plugin module to execute · **Hosting with Amplify Console (Managed hosting with custom domains, Continuous deployment)**
- Choose a type **Manual deployment**

```console
amplify publish
```
Now you can test the application using the provided URL.