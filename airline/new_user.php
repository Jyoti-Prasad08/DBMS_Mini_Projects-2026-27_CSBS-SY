<!DOCTYPE html>
<html>
<head>
	<title>Create New User Account</title>
	<link rel="stylesheet" type="text/css" href="css/style.css">
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

		h2 {
			font-size: 1.5em;
			margin-bottom: 20px;
		}

		strong {
			display: block;
			margin-bottom: 10px;
		}
	</style>
</head>
<body>
	<div class="header">
		<img class="logo" src="images/_28be87a0-3009-46c2-a282-4a8ad507df1f.jpeg" alt="Indian Airlines Logo">
		<h1 id="title">INDIAN AIRLINES</h1>
		<div>
			<ul>
				<li><a href="home_page.php"><i class="fa fa-home" aria-hidden="true"></i> Home</a></li>
				<li><a href="login_page.php"><i class="fa fa-ticket" aria-hidden="true"></i> Book Tickets</a></li>
				<li><a href="home_page.php"><i class="fa fa-plane" aria-hidden="true"></i> About Us</a></li>
				<li><a href="home_page.php"><i class="fa fa-phone" aria-hidden="true"></i> Contact Us</a></li>
				<li><a href="login_page.php"><i class="fa fa-sign-in" aria-hidden="true"></i> Login</a></li>
			</ul>
		</div>
	</div>

	<div class="container">
		<form action="new_user_form_handler.php" method="POST" id="new_user_form">
			<h2><i class="fa fa-user-plus" aria-hidden="true"></i> CREATE NEW USER ACCOUNT</h2>
			<br>
			<table cellpadding='10'>
				<caption><strong>ENTER LOGIN DETAILS</strong></caption>
				<tr>
					<td>Enter a valid username</td>
					<td><input type="text" name="username" required><br><br></td>
				</tr>
				<tr>
					<td>Enter your desired password</td>
					<td><input type="password" name="password" required><br><br></td>
				</tr>
				<tr>
					<td>Enter your email ID</td>
					<td><input type="text" name="email" required><br><br></td>
				</tr>
			</table>
			<br>
			<table cellpadding='10'>
				<caption><strong>ENTER CUSTOMER'S PERSONAL DETAILS</strong></caption>
				<tr>
					<td>Enter your name</td>
					<td><input type="text" name="name" required><br><br></td>
				</tr>
				<tr>
					<td>Enter your phone no.</td>
					<td><input type="text" name="phone_no" required><br><br></td>
				</tr>
				<tr>
					<td>Enter your address</td>
					<td><input type="text" name="address" required><br><br></td>
				</tr>
			</table>
			<br>
			<input type="submit" value="Submit" name="Submit">
			<br>
		</form>
	</div>
</body>
</html>
