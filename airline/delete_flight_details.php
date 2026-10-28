<?php
	session_start();
?>
<!DOCTYPE html>
<html>
<head>
	<title>Delete Flight Schedule Details</title>
	<!-- External CSS -->
	<link rel="stylesheet" href="css/style.css">
	<link rel="stylesheet" href="font-awesome-4.7.0/css/font-awesome.min.css">
	<style>
		body {
			margin: 0;
			padding: 0;
			background: url('images/_54ad6a27-e0bb-42d4-9693-bd5482d4ca31.jpeg') no-repeat center center fixed;
			background-size: cover;
			font-family: Arial, sans-serif;
			color: #333;
		}

		.header {
			background-color: rgba(255, 255, 255, 0.9);
			padding: 20px;
			position: relative;
			text-align: center;
			box-shadow: 0 2px 5px rgba(0,0,0,0.3);
		}

		.logo {
			position: absolute;
			top: 10px;
			left: 10px;
			width: 100px; /* Adjust size as needed */
			height: auto;
		}

		h1 {
			margin: 0;
			font-size: 2em;
		}

		ul {
			list-style-type: none;
			padding: 0;
			margin: 20px 0;
			text-align: center;
		}

		ul li {
			display: inline;
			margin: 0 15px;
		}

		ul li a {
			text-decoration: none;
			color: #030337;
			font-weight: bold;
			padding: 10px;
			border-radius: 4px;
			background-color: rgba(255, 255, 255, 0.8);
			box-shadow: 0 1px 3px rgba(0,0,0,0.2);
		}

		ul li a:hover {
			text-decoration: underline;
			background-color: rgba(255, 255, 255, 0.9);
		}

		.container {
			max-width: 800px;
			margin: 0 auto;
			padding: 20px;
			background: rgba(255, 255, 255, 0.8);
			border-radius: 8px;
			box-shadow: 0 2px 10px rgba(0,0,0,0.3);
		}

		table {
			width: 100%;
			border-collapse: collapse;
			margin: 20px 0;
		}

		th, td {
			padding: 10px;
			border: 1px solid #ddd;
			text-align: left;
		}

		th {
			background-color: #f4f4f4;
		}

		input {
			border: 1.5px solid #030337;
			border-radius: 4px;
			padding: 7px 10px;
			width: calc(100% - 20px);
			box-sizing: border-box;
		}

		input[type=submit] {
			background-color: #030337;
			color: white;
			border-radius: 4px;
			padding: 10px 20px;
			margin: 20px 0;
			cursor: pointer;
		}

		input[type=submit]:hover {
			background-color: #020a33;
		}

		.message {
			color: #d9534f; /* Red color for error messages */
			font-weight: bold;
		}

		.success {
			color: #5bc0de; /* Light blue color for success messages */
			font-weight: bold;
		}
	</style>
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
		<form action="delete_flight_details_form_handler.php" method="post">
			<h2>ENTER THE FLIGHT SCHEDULE TO BE DELETED</h2>
			<?php
				if (isset($_GET['msg']) && $_GET['msg'] == 'success') {
					echo "<p class='success'>The Flight Schedule has been successfully deleted.</p>";
				} else if (isset($_GET['msg']) && $_GET['msg'] == 'failed') {
					echo "<p class='message'>*Invalid Flight No./Departure Date, please enter again.</p>";
				}
			?>
			<table cellpadding="5">
				<tr>
					<td class="fix_table">Enter a valid Flight No.</td>
					<td class="fix_table">Enter the Departure Date</td>
				</tr>
				<tr>
					<td class="fix_table"><input type="text" name="flight_no" required></td>
					<td class="fix_table"><input type="date" name="departure_date" required></td>
				</tr>
			</table>
			<br>
			<input type="submit" value="Delete" name="Delete">
		</form>
	</div>
</body>
</html>
