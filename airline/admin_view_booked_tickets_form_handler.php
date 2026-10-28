<?php
	session_start();
?>
<!DOCTYPE html>
<html>
<head>
	<title>View Booked Tickets</title>
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
			max-width: 1200px;
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
			padding: 7px 15px;
			margin: 10px 0;
			width: calc(100% - 30px);
			box-sizing: border-box;
		}

		input[type=submit] {
			background-color: #030337;
			color: white;
			border-radius: 4px;
			padding: 10px 20px;
			margin: 10px 0;
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
		<ul>
			<li><a href="admin_homepage.php"><i class="fa fa-home" aria-hidden="true"></i> Home</a></li>
			<li><a href="admin_homepage.php"><i class="fa fa-desktop" aria-hidden="true"></i> Dashboard</a></li>
			<li><a href="logout_handler.php"><i class="fa fa-sign-out" aria-hidden="true"></i> Logout</a></li>
		</ul>
	</div>

	<div class="container">
		<h2>LIST OF BOOKED TICKETS FOR THE FLIGHT</h2>
		<?php
			if (isset($_POST['Submit'])) {
				$data_missing = array();
				if (empty($_POST['flight_no'])) {
					$data_missing[] = 'Flight No.';
				} else {
					$flight_no = trim($_POST['flight_no']);
				}
				if (empty($_POST['departure_date'])) {
					$data_missing[] = 'Departure Date';
				} else {
					$departure_date = $_POST['departure_date'];
				}

				if (empty($data_missing)) {
					require_once('Database Connection file/mysqli_connect.php');
					$query = "SELECT pnr, date_of_reservation, class, no_of_passengers, payment_id, customer_id 
							  FROM Ticket_Details 
							  WHERE flight_no = ? AND journey_date = ? AND booking_status = 'CONFIRMED' 
							  ORDER BY class";
					$stmt = mysqli_prepare($dbc, $query);
					mysqli_stmt_bind_param($stmt, "ss", $flight_no, $departure_date);
					mysqli_stmt_execute($stmt);
					mysqli_stmt_bind_result($stmt, $pnr, $date_of_reservation, $class, $no_of_passengers, $payment_id, $customer_id);
					mysqli_stmt_store_result($stmt);
					if (mysqli_stmt_num_rows($stmt) == 0) {
						echo "<p class='message'>No booked tickets information is available!</p>";
					} else {
						echo "<table cellpadding=\"10\">";
						echo "<tr><th>PNR</th>
							  <th>Date of Reservation</th>
							  <th>Class</th>
							  <th>No. of Passengers</th>
							  <th>Payment ID</th>
							  <th>Customer ID</th>
							  </tr>";
						while (mysqli_stmt_fetch($stmt)) {
							echo "<tr>
								  <td>{$pnr}</td>
								  <td>{$date_of_reservation}</td>
								  <td>{$class}</td>
								  <td>{$no_of_passengers}</td>
								  <td>{$payment_id}</td>
								  <td>{$customer_id}</td>
								  </tr>";
						}
						echo "</table>";
					}
					mysqli_stmt_close($stmt);
					mysqli_close($dbc);
				} else {
					echo "<p class='message'>The following data fields were empty!<br>";
					foreach ($data_missing as $missing) {
						echo $missing . "<br>";
					}
					echo "</p>";
				}
			} else {
				echo "<p class='message'>Submit request not received</p>";
			}
		?>
	</div>
</body>
</html>
