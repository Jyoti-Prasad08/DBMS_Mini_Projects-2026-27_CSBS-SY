<?php
	session_start();
?>
<html>
	<head>
		<title>Welcome Administrator</title>
		<link rel="stylesheet" href="font-awesome-4.7.0/css/font-awesome.min.css">
		<style>
			body {
				background-image: url('images/_54ad6a27-e0bb-42d4-9693-bd5482d4ca31.jpeg'); /* Path to your background image */
				background-size: cover;
				background-repeat: no-repeat;
				background-attachment: fixed; /* Ensures the background image doesn't scroll */
				font-family: Arial, sans-serif;
				margin: 0;
				padding: 0;
			}

			.logo {
				width: 150px; /* Adjust as needed */
				height: auto;
				display: block;
				margin: 20px auto; /* Centers the logo */
			}

			#title {
				text-align: center;
				color: #ffffff; /* Change to a color that contrasts with your background */
				font-size: 2em;
				margin-top: 0;
				font-weight: bold; /* Bold title */
			}

			div {
				text-align: center;
				margin-top: 20px;
			}

			ul {
				list-style-type: none;
				padding: 0;
				margin: 0;
			}

			ul li {
				display: inline;
				margin-right: 20px;
			}

			ul li a {
				color: #ffffff; /* Change to a color that contrasts with your background */
				text-decoration: none;
				font-size: 1.2em;
				font-weight: bold; /* Bold links */
			}

			.admin_func {
				padding: 10px;
				border: 2px solid #ffffff; /* Border color and size */
				margin: 10px 0; /* Margin between rows */
				border-radius: 5px; /* Rounded corners for the border */
				background-color: rgba(0, 0, 0, 0.5); /* Optional: background color for better readability */
			}

			.admin_func a {
				color: #ffffff; /* Adjust to suit your design */
				text-decoration: none;
				font-size: 1.1em;
				font-weight: bold; /* Bold function links */
			}

			.admin_func a i {
				margin-right: 8px;
			}

			h2 {
				text-align: center;
				color: #ffffff; /* Change to a color that contrasts with your background */
				font-weight: bold; /* Bold heading */
			}
		</style>
	</head>
	<body>
		<img class="logo" src="images/_28be87a0-3009-46c2-a282-4a8ad507df1f.jpeg" alt="Indian Airlines Logo"/> 
		<h1 id="title">INDIAN AIRLINES</h1>
		<div>
			<ul>
				<li><a href="admin_homepage.php"><i class="fa fa-home" aria-hidden="true"></i> Home</a></li>
				<li><a href="admin_homepage.php"><i class="fa fa-desktop" aria-hidden="true"></i> Dashboard</a></li>
				<li><a href="logout_handler.php"><i class="fa fa-sign-out" aria-hidden="true"></i> Logout</a></li>
			</ul>
		</div>
		<h2>Welcome Administrator!</h2>
		<table cellpadding="5" style="width: 100%; text-align: center;">
			<tr>
				<td class="admin_func"><a href="admin_view_booked_tickets.php"><i class="fa fa-plane" aria-hidden="true"></i> View List of Booked Tickets for a Flight</a></td>
			</tr>
			<tr>
				<td class="admin_func"><a href="add_flight_details.php"><i class="fa fa-plane" aria-hidden="true"></i> Add Flight Schedule Details</a></td>
			</tr>
			<tr>
				<td class="admin_func"><a href="delete_flight_details.php"><i class="fa fa-plane" aria-hidden="true"></i> Delete Flight Schedule Details</a></td>
			</tr>
			<tr>
				<td class="admin_func"><a href="update_ticket_price.php"><i class="fa fa-tag" aria-hidden="true"></i> Update Ticket Price</a></td>
			</tr>
			<tr>
				<td class="admin_func"><a href="admin_view_customer_messages.php"><i class="fa fa-envelope" aria-hidden="true"></i> View Customer Messages</a></td>
			</tr>
		</table>
	</body>
</html>
