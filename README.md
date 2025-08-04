# Full-Stack AWS Scalable Web Application

This project is a complete blueprint for deploying a scalable, highly available web application on AWS. It features a React frontend, a FastAPI backend, and a robust cloud infrastructure designed for performance and resilience.

---

<!--
  <<< PASTE YOUR ARCHITECTURE DIAGRAM IMAGE HERE >>>
  Example:
  ![AWS Architecture Diagram](path/to/your/diagram.png)
-->

![AWS Architecture Diagram](AWS%20Final%20Project%20Diagram.jpg)

## Project Description

This application provides a simple newsletter subscription service. Users can submit their email via a web form, and the backend saves it to a PostgreSQL database. The frontend can also display the current list of subscribers.

The primary goal of this repository is to demonstrate a production-ready architecture on AWS, incorporating best practices for security, scalability, and content delivery.

## Tech Stack

**Frontend:**

- **React.js:** For building the user interface.
- **CSS:** For styling.

**Backend:**

- **FastAPI (Python):** A modern, high-performance web framework for building APIs.
- **SQLAlchemy:** For Object-Relational Mapping (ORM) to interact with the database.
- **Docker:** For containerizing the backend application.

**Cloud Infrastructure (AWS):**

- **VPC:** Network isolation with public and private subnets.
- **EC2 & Auto Scaling Group:** For scalable compute power.
- **Application Load Balancer (ALB):** To distribute traffic.
- **RDS (PostgreSQL):** Managed relational database with Multi-AZ for high availability.
- **S3:** To host the static frontend assets.
- **CloudFront:** Global Content Delivery Network (CDN) for low-latency access and routing.
- **ECR (Elastic Container Registry):** To store the backend Docker image.
- **CloudWatch:** For monitoring and triggering scaling events.

---

## Prerequisites

Before you begin, ensure you have the following installed and configured:

1.  **An AWS Account** with administrative privileges.
2.  **AWS CLI** configured with your credentials.
3.  **Docker** installed and running on your local machine.
4.  **Node.js and npm** (v16 or later).
5.  **Python** (v3.8 or later).

---

## Deployment Steps

Follow these steps in order to deploy the entire application stack.

### Step 1: Backend Deployment (Docker & ECR)

First, we'll containerize the backend application and push it to Amazon's container registry.

1.  **Navigate to the backend directory:**

    ```bash
    cd backend
    ```

2.  **Build the Docker image:**

    ```bash
    docker build -t newsletter-app-backend .
    ```

3.  **Create an ECR Repository:**
    Go to the AWS Console -> ECR -> Create repository. Name it `newsletter-app-backend`. Note the repository URI.

4.  **Authenticate Docker with ECR:**
    Replace `<REGION>` and `<AWS_ACCOUNT_ID>` with your specific values.

    ```bash
    aws ecr get-login-password --region <REGION> | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com
    ```

5.  **Tag and Push the Image to ECR:**
    Replace the URI with your actual ECR repository URI.

    ```bash
    # Tag the image
    docker tag newsletter-app-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/newsletter-app-backend:latest

    # Push the image
    docker push <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/newsletter-app-backend:latest
    ```

### Step 2: Frontend Deployment (S3)

Next, we'll build the static frontend files and upload them to an S3 bucket.

1.  **Navigate to the frontend directory:**

    ```bash
    cd ../frontend
    ```

2.  **Install dependencies and build the project:**

    ```bash
    npm install
    npm run build
    ```

    This will create a `build` directory containing the static files.

3.  **Create an S3 Bucket:**
    Go to the AWS Console -> S3 -> Create bucket. Give it a globally unique name (e.g., `my-newsletter-app-frontend-12345`). Uncheck "Block all public access" and acknowledge the warning.

4.  **Upload the build files to S3:**
    Use the AWS CLI to sync the contents of your local `build` folder to the S3 bucket.

    ```bash
    aws s3 sync ./build s3://<YOUR_BUCKET_NAME>
    ```

5.  **Enable Static Website Hosting:**
    In your S3 bucket's properties, find "Static website hosting," enable it, and set the index document to `index.html`.

### Step 3: Infrastructure Provisioning on AWS

Now, set up the core AWS infrastructure. This guide uses the AWS Management Console. For production, consider using an IaC tool like Terraform or CloudFormation.

1.  **VPC & Networking:**

    - Create a **VPC**.
    - Create two **Private Subnets** and one **Public Subnet**, each in a different Availability Zone.
    - Create an **Internet Gateway** (attach to VPC) and a **NAT Gateway** (place in the public subnet).
    - Configure **Route Tables**: The public route table should point to the Internet Gateway; the private route table should point to the NAT Gateway.

2.  **RDS Database:**

    - Create an **RDS Subnet Group** using your two private subnets.
    - Launch a **PostgreSQL RDS instance**.
    - Place it in the RDS Subnet Group.
    - **Enable Multi-AZ deployment** for high availability.
    - Keep the database credentials (username, password, endpoint URL) safe. You will need them.

3.  **Security Groups:**

    - **RDS Security Group:** Allows inbound traffic on port `5432` only from the `EC2 Security Group`.
    - **EC2 Security Group:** Allows inbound traffic on port `80` only from the `ALB Security Group`.
    - **ALB Security Group:** Allows inbound traffic on ports `80` (HTTP) and `443` (HTTPS) from anywhere (`0.0.0.0/0`).

4.  **EC2 Launch Template & Auto Scaling:**

    - Create a **Launch Template** for your EC2 instances.
      - Choose an AMI (e.g., Amazon Linux 2).
      - Assign the `EC2 Security Group`.
      - **Crucially, create an IAM Role** that grants EC2 permissions to access ECR (`AmazonEC2ContainerRegistryReadOnly`) and attach it.
      - In the "User data" section, paste the user data script provided in the project, making sure to replace all placeholders (`<REGION>`, `<AWS_ACCOUNT_ID>`, `<YOUR_ECR_REPO>`, and the `DATABASE_URL` components).
    - Create an **Auto Scaling Group** using this launch template, configured to run in your two private subnets. Set desired/min/max instances (e.g., 2, 1, 4).

5.  **Application Load Balancer (ALB):**

    - Create an **internet-facing ALB**.
    - Place it in your public subnets.
    - Create a **Target Group** that points to your Auto Scaling Group on port `80`. Set the health check path to `/health`.
    - Create a **Listener** on the ALB for port `80` that forwards traffic to this target group.

6.  **CloudFront Distribution:**
    - Create a **CloudFront distribution**.
    - **Create two Origins:**
      1.  **S3 Origin:** Point it to the S3 bucket you created.
      2.  **ALB Origin:** Point it to the DNS name of your Application Load Balancer.
    - **Configure Behaviors:**
      1.  **Default (`*`) Behavior:** Set the origin to your **S3 Origin**.
      2.  **New Behavior:** Create a new behavior with the Path Pattern `/api/*`. Set its origin to your **ALB Origin**. This routes all API calls to your backend.

### Step 4: Accessing the Application

Once the CloudFront distribution is deployed (this can take a few minutes), you can access your application.

1.  Go to the CloudFront console.
2.  Find your distribution and copy its **Domain Name** (e.g., `d12345abcdef.cloudfront.net`).
3.  Paste this URL into your browser. You should see the React frontend, ready to use!

---

## Local Development

To run the application on your local machine for development, it's highly recommended to use Docker Compose for a consistent environment.

### Running the Local Stack

1.  **Start Docker Compose:** From the project's root directory, run the following command. This will build the backend image (if it's changed) and start both the backend and database containers.

    ```bash
    docker-compose up --build
    ```

2.  **Start the Frontend:** In a **new terminal**, navigate to the frontend directory and start the React development server.
    ```bash
    cd frontend
    npm install
    npm start
    ```
    Your browser should open to `http://localhost:3000`, and the application will be fully functional for local testing.

---
