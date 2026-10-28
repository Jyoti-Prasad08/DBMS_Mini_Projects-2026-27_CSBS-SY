<?php
	session_start();
	include 'C:\xampp\htdocs\AIRLINE\AIRLINE\mysqli_connect.php';

	if ($_SERVER['REQUEST_METHOD'] == 'POST') {
		$flight_no = mysqli_real_escape_string($dbc, $_POST['flight_no']);
		$class = mysqli_real_escape_string($dbc, $_POST['class']);
		$departure_date = mysqli_real_escape_string($dbc, $_POST['departure_date']);
		
		$column_name = "";
		switch ($class) {
			case "Economy":
				$column_name = "seats_economy";
				break;
			case "Business":
				$column_name = "seats_business";
				break;
			default:
				$column_name = "seats_economy";
		}

		$query = "SELECT $column_name AS seats_available FROM flight_details WHERE flight_no='$flight_no' AND departure_date='$departure_date'";
		$result = mysqli_query($dbc, $query);

		if (mysqli_num_rows($result) == 1) {
			$row = mysqli_fetch_assoc($result);
			$seats_available = $row['seats_available'];
		} else {
			$seats_available = "No data found for this flight number, class, and departure date.";
		}
		mysqli_close($dbc);
	}
?>

<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Check Seat Availability - Aadith Airlines</title>
	<style>
		body {
			font-family: Arial, sans-serif;
			background-image: url('images/_54ad6a27-e0bb-42d4-9693-bd5482d4ca31.jpeg');
			background-size: cover;
			background-repeat: no-repeat;
			background-attachment: fixed;
			color: #ffffff;
			margin: 0;
			padding: 0;
		}
		.container {
			width: 50%;
			margin: 50px auto;
			background: rgba(0, 0, 0, 0.8);
			padding: 20px;
			border-radius: 10px;
		}
		h2 {
			text-align: center;
			font-size: 2em;
		}
		form {
			display: flex;
			flex-direction: column;
			align-items: center;
		}
		label, input, select {
			margin: 10px 0;
		}
		input, select {
			padding: 10px;
			width: 80%;
			border-radius: 5px;
			border: 1px solid #ccc;
		}
		input[type="submit"] {
			background: #007BFF;
			color: #fff;
			border: none;
			cursor: pointer;
			width: auto;
		}
		input[type="submit"]:hover {
			background: #0056b3;
		}
		.result {
			text-align: center;
			margin-top: 20px;
		}
	</style>
</head>
<body>
	<div class="container">
		<h2>Check Seat Availability</h2>
		<form action="" method="POST">
			<label for="flight_no">Flight Number:</label>
			<input type="text" id="flight_no" name="flight_no" required>

			<label for="class">Class:</label>
			<select id="class" name="class" required>
				<option value="Economy">Economy</option>
				<option value="Business">Business</option>
			</select>

			<label for="departure_date">Departure Date:</label>
			<input type="date" id="departure_date" name="departure_date" required>

			<input type="submit" value="Check Availability">
		</form>

		<?php if (isset($seats_available)): ?>
			<div class="result">
				<h3>Seats Available: <?php echo $seats_available; ?></h3>
			</div>
		<?php endif; ?>
	</div>
</body>
</html>
