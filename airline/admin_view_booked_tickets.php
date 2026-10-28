<?php
	session_start();
?>
<!DOCTYPE html>
<html>
<head>
	<title>View Booked Tickets</title>
	<style>
		body {
			font-family: Arial, sans-serif;
			margin: 0;
			padding: 0;
			background-color: #f4f4f4; /* Light grey background color */
			text-align: center;
		}

		.header {
			position: relative;
			padding: 20px;
			background: rgba(255, 255, 255, 0.8);
			margin-bottom: 20px;
		}

		.logo {
			position: absolute;
			top: 10px;
			left: 10px;
			width: 150px;
			height: auto;
		}

		h1 {
			color: #333;
			margin: 0;
		}

		ul {
			list-style-type: none;
			padding: 0;
			margin: 0;
		}

		ul li {
			display: inline;
			margin: 0 10px;
		}

		ul li a {
			text-decoration: none;
			color: #030337;
			font-weight: bold;
		}

		ul li a:hover {
			text-decoration: underline;
		}

		.container {
			width: 60%;
			margin: 50px auto;
			background: #fff;
			padding: 20px;
			border-radius: 5px;
			box-shadow: 0 0 10px rgba(0,0,0,0.1);
			position: relative;
			z-index: 2;
		}

		input {
			border: 1.5px solid #030337;
			border-radius: 4px;
			padding: 7px 30px;
			margin: 10px 0;
			width: 100%;
			box-sizing: border-box;
		}

		input[type=submit] {
			background-color: #030337;
			color: white;
			border-radius: 4px;
			padding: 7px 45px;
			margin-top: 10px;
		}

		input[type=submit]:hover {
			background-color: #020a33;
		}

		input[type=date] {
			padding: 5.5px 44.5px;
		}

		table {
			margin: 0 auto;
			width: 100%;
		}

		.fix_table {
			padding: 10px;
			text-align: left;
		}
	</style>
	<link rel="stylesheet" type="text/css" href="css/style.css"/>
	<link rel="stylesheet" href="font-awesome-4.7.0/css/font-awesome.min.css">
</head>
<body>
	<div class="header">
		<img class="logo" src="images/_28be87a0-3009-46c2-a282-4a8ad507df1f.jpeg" alt="Aadith Airlines Logo">
		<h1 id="title">INDIAN AIRLINES</h1>
		<div>
			<ul>
				<li><a href="admin_homepage.php"><i class="fa fa-home" aria-hidden="true"></i> Home</a></li>
				<li><a href="admin_homepage.php"><i class="fa fa-desktop" aria-hidden="true"></i> Dashboard</a></li>
				<li><a href="logout_handler.php"><i class="fa fa-sign-out" aria-hidden="true"></i> Logout</a></li>
			</ul>
		</div>
	</div>
	<div class="container">
		<form action="admin_view_booked_tickets_form_handler.php" method="post">
			<h2>VIEW LIST OF BOOKED TICKETS FOR A FLIGHT</h2>
			<table cellpadding="5">
				<tr>
					<td class="fix_table">Enter the Flight No.</td>
					<td class="fix_table">Enter the Departure Date</td>
				</tr>
				<tr>
					<td class="fix_table"><input type="text" name="flight_no" required></td>
					<td class="fix_table"><input type="date" name="departure_date" required></td>
				</tr>
			</table>
			<input type="submit" value="Submit" name="Submit">
		</form>
	</div>
</body>
</html>
