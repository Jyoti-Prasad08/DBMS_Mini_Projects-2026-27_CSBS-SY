<?php
	session_start();

	// Include the database connection file
	include 'Database Connection file/mysqli_connect.php';

	// Initialize message variable
	$message = "";

	if ($_SERVER["REQUEST_METHOD"] == "POST") {
		$flight_no = $_POST['flight_no'];
		$departure_date = $_POST['departure_date'];
		$new_price_economy = $_POST['new_price_economy'];
		$new_price_business = $_POST['new_price_business'];

		// Prepare and bind
		$sql = "UPDATE flight_details SET price_economy = ?, price_business = ? WHERE flight_no = ? AND departure_date = ?";
		$stmt = $dbc->prepare($sql);
		$stmt->bind_param("ddss", $new_price_economy, $new_price_business, $flight_no, $departure_date);

		// Execute and check success
		if ($stmt->execute()) {
			$message = "Ticket prices updated successfully.";
		} else {
			$message = "Error updating ticket prices: " . $stmt->error;
		}

		$stmt->close();
	}

	$dbc->close();
?>
<!DOCTYPE html>
<html>
<head>
	<title>Update Ticket Prices</title>
	<link rel="stylesheet" href="font-awesome-4.7.0/css/font-awesome.min.css">
	<style>
		body {
			font-family: Arial, sans-serif;
			margin: 0;
			padding: 0;
			background: url('images/_54ad6a27-e0bb-42d4-9693-bd5482d4ca31.jpeg') no-repeat center center fixed;
			background-size: cover;
			text-align: center;
		}

		.container {
			width: 50%;
			margin: 50px auto;
			background: #fff;
			padding: 20px;
			border-radius: 5px;
			box-shadow: 0 0 10px rgba(0,0,0,0.1);
			position: relative;
			z-index: 2;
		}

		h1 {
			color: #333;
		}

		input[type="text"], input[type="number"], input[type="date"] {
			padding: 10px;
			margin: 10px 0;
			width: 100%;
			box-sizing: border-box;
		}

		input[type="submit"] {
			padding: 10px;
			background: #007bff;
			color: #fff;
			border: none;
			cursor: pointer;
			border-radius: 5px;
		}

		input[type="submit"]:hover {
			background: #0056b3;
		}

		.message {
			color: #d9534f; /* Red color for error messages */
			font-weight: bold;
		}

		.success {
			color: #5bc0de; /* Light blue color for success messages */
			font-weight: bold;
		}

		.logo {
			position: absolute;
			top: 10px;
			left: 10px;
			width: 150px;
			height: auto;
			z-index: 1;
		}
	</style>
</head>
<body>
	<img class="logo" src="images/_28be87a0-3009-46c2-a282-4a8ad507df1f.jpeg" alt="Aadith Airlines Logo">
	<div class="container">
		<h1>Update Ticket Prices</h1>
		<?php if (!empty($message)) { ?>
			<p class="<?php echo strpos($message, 'successfully') !== false ? 'success' : 'message'; ?>">
				<?php echo $message; ?>
			</p>
		<?php } ?>
		<form method="post" action="update_ticket_price.php">
			<label for="flight_no">Flight Number:</label>
			<input type="text" id="flight_no" name="flight_no" required>

			<label for="departure_date">Departure Date:</label>
			<input type="date" id="departure_date" name="departure_date" required>

			<label for="new_price_economy">New Economy Ticket Price:</label>
			<input type="number" id="new_price_economy" name="new_price_economy" step="0.01" required>

			<label for="new_price_business">New Business Ticket Price:</label>
			<input type="number" id="new_price_business" name="new_price_business" step="0.01" required>

			<input type="submit" value="Update Prices">
		</form>
	</div>
</body>
</html>
