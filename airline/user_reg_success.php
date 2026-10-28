<!DOCTYPE html>
<html>
<head>
	<title>Create New User Account</title>
	<style>
		body {
			margin: 0;
			padding: 0;
			background: url('images/_54ad6a27-e0bb-42d4-9693-bd5482d4ca31.jpeg') no-repeat center center fixed;
			background-size: cover;
			font-family: 'Arial', sans-serif;
			color: #333;
		}

		.header {
			background-color: rgba(255, 255, 255, 0.9);
			padding: 20px;
			position: relative;
			text-align: center;
			box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
			display: flex;
			justify-content: center;
			align-items: center;
		}

		.logo {
			position: absolute;
			top: 10px;
			left: 10px;
			width: 100px;
			height: auto;
		}

		h1 {
			margin: 0;
			font-size: 2.5em;
			color: #030337;
			text-transform: uppercase;
			letter-spacing: 2px;
		}

		nav {
			margin-top: 20px;
		}

		nav ul {
			list-style-type: none;
			padding: 0;
			margin: 0;
			display: flex;
			justify-content: center;
			gap: 20px;
		}

		nav ul li {
			display: inline;
		}

		nav ul li a {
			text-decoration: none;
			color: #030337;
			font-weight: bold;
			padding: 10px 20px;
			border-radius: 4px;
			background-color: rgba(255, 255, 255, 0.8);
			transition: background-color 0.3s, color 0.3s;
		}

		nav ul li a:hover {
			text-decoration: underline;
			background-color: rgba(255, 255, 255, 0.9);
			color: #000;
		}

		.container {
			max-width: 800px;
			margin: 40px auto;
			padding: 20px;
			background: rgba(255, 255, 255, 0.85);
			border-radius: 8px;
			box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
			text-align: center;
		}

		h3 {
			margin-top: 20px;
			color: #030337;
			font-size: 1.5em;
			text-transform: uppercase;
		}

		form {
			margin-top: 20px;
			text-align: left;
		}

		form h2 {
			color: #030337;
			font-size: 1.8em;
			margin-bottom: 20px;
		}

		form table {
			width: 100%;
			margin-bottom: 20px;
		}

		form table tr td {
			padding: 10px;
		}

		form table tr td input {
			width: 100%;
			padding: 10px;
			border: 1.5px solid #030337;
			border-radius: 4px;
		}

		form input[type=submit] {
			background-color: #030337;
			color: white;
			border-radius: 4px;
			padding: 10px 20px;
			margin: 20px auto;
			display: block;
			cursor: pointer;
			transition: background-color 0.3s;
		}

		form input[type=submit]:hover {
			background-color: #000;
		}
	</style>
	<link rel="stylesheet" type="text/css" href="css/style.css"/>
	<link rel="stylesheet" href="font-awesome-4.7.0/css/font-awesome.min.css">
</head>
<body>
	<div class="header">
		<img class="logo" src="images/_28be87a0-3009-46c2-a282-4a8ad507df1f.jpeg" alt="Indian Airlines Logo">
		<h1 id="title">Indian Airlines</h1>
	</div>
	<nav>
		<ul>
			<li><a href="home_page.php"><i class="fa fa-home" aria-hidden="true"></i> Home</a></li>
			<li><a href="login_page.php"><i class="fa fa-ticket" aria-hidden="true"></i> Book Tickets</a></li>
			<li><a href="home_page.php"><i class="fa fa-plane" aria-hidden="true"></i> About Us</a></li>
			<li><a href="home_page.php"><i class="fa fa-phone" aria-hidden="true"></i> Contact Us</a></li>
			<li><a href="login_page.php"><i class="fa fa-sign-in" aria-hidden="true"></i> Login</a></li>
		</ul>
	</nav>
	<div class="container">
		<h3>New user successfully registered! Login into your account to book tickets.</h3>
	</div>
</body>
</html>
