<?php
	session_start();
	// Include the database connection file
	include 'C:\xampp\htdocs\AIRLINE\AIRLINE\mysqli_connect.php';

	// Fetch customer messages from the database
	$query = "SELECT * FROM contact_messages";
	$result = mysqli_query($dbc, $query);
?>
<html>
	<head>
		<title>View Customer Messages</title>
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
				width: 80%;
				margin: 50px auto;
				background: rgba(0, 0, 0, 0.8);
				padding: 20px;
				border-radius: 10px;
			}
			h2 {
				text-align: center;
				font-size: 2em;
			}
			table {
				width: 100%;
				border-collapse: collapse;
				margin-top: 20px;
			}
			th, td {
				padding: 10px;
				border: 1px solid #ffffff;
				text-align: left;
			}
			th {
				background-color: #007BFF;
			}
			tr:nth-child(even) {
				background-color: rgba(255, 255, 255, 0.1);
			}
		</style>
	</head>
	<body>
		<div class="container">
			<h2>Customer Messages</h2>
			<table>
				<tr>
					<th>Name</th>
					<th>Email</th>
					<th>Message</th>
				</tr>
				<?php
					if (mysqli_num_rows($result) > 0) {
						while ($row = mysqli_fetch_assoc($result)) {
							echo "<tr>
								<td>{$row['name']}</td>
								<td>{$row['email']}</td>
								<td>{$row['message']}</td>
							</tr>";
						}
					} else {
						echo "<tr><td colspan='3'>No messages found</td></tr>";
					}
					mysqli_close($dbc);
				?>
			</table>
		</div>
	</body>
</html>
