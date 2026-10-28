<?php
	session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket Booking Successful</title>
    <link rel="stylesheet" type="text/css" href="css/style.css"/>
    <link rel="stylesheet" href="font-awesome-4.7.0/css/font-awesome.min.css">
    <style>
        body {
            background-image: url('images/_54ad6a27-e0bb-42d4-9693-bd5482d4ca31.jpeg');
            background-size: cover;
            background-attachment: fixed;
            font-family: Arial, sans-serif;
            color: #333;
            margin: 0;
            padding: 0;
            text-align: center;
        }
        .logo {
            display: block;
            margin: 20px auto;
            width: 200px; /* Adjust size of the logo */
        }
        h1, h2, h3 {
            color: #030337;
        }
        h2 {
            margin-top: 20px;
        }
        h3 {
            margin: 20px;
            font-size: 18px;
        }
        ul {
            list-style-type: none;
            padding: 0;
            background-color: #030337;
            margin: 0;
            border-radius: 8px;
        }
        ul li {
            display: inline;
            margin: 0;
        }
        ul li a {
            color: #fff;
            text-decoration: none;
            padding: 10px 20px;
            display: inline-block;
        }
        ul li a:hover {
            background-color: #ddd;
            color: #000;
        }
        input {
            border: 1.5px solid #030337;
            border-radius: 4px;
            padding: 7px 30px;
        }
        input[type=submit] {
            background-color: #030337;
            color: white;
            border-radius: 4px;
            padding: 7px 45px;
            margin: 20px auto;
            display: block;
            cursor: pointer;
        }
        .container {
            background-color: rgba(255, 255, 255, 0.9); /* Slightly opaque background for readability */
            padding: 20px;
            margin: 20px auto;
            max-width: 800px; /* Adjust width as needed */
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <img class="logo" src="images/_28be87a0-3009-46c2-a282-4a8ad507df1f.jpeg" alt="Indian Airlines Logo"/>
        <h1 id="title">INDIAN AIRLINES</h1>
        
        <div>
            <ul>
                <li><a href="customer_homepage.php"><i class="fa fa-home" aria-hidden="true"></i> Home</a></li>
                <li><a href="customer_homepage.php"><i class="fa fa-desktop" aria-hidden="true"></i> GO BACK</a></li>
            </ul>
        </div>
        <h2>BOOKING SUCCESSFUL</h2>
        <h3>Your payment of &#x20b9; <?php echo $_SESSION['total_amount']; ?> has been received.<br><br>Your PNR is <strong><?php echo $_SESSION['pnr'];?></strong>. Your tickets have been booked successfully.</h3>
        <input type="button" value="Back to Home" onclick="window.location.href='customer_homepage.php'">
    </div>
</body>
</html>
