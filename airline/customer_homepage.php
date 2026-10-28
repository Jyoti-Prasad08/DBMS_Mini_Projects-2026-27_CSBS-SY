<?php
	session_start();
	// Uncomment the following lines if login validation is needed
	// if($_SESSION['login_user']==null){
	// 	header('location:home_page.php');
	// }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome Customer</title>
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
        h1, h2 {
            color: #030337;
        }
        h2 {
            margin-top: 20px;
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
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px auto;
        }
        td {
            padding: 10px;
            border: solid thin #ddd;
        }
        .admin_func {
            font-weight: bold; /* Bold the text */
        }
        .admin_func a {
            color: #030337;
            text-decoration: none;
            display: block;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin: 10px 0;
        }
        .admin_func a:hover {
            background-color: #030337;
            color: white;
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
        input[type=date] {
            border: 1.5px solid #030337;
            border-radius: 4px;
            padding: 5.5px 44.5px;
        }
        select {
            border: 1.5px solid #030337;
            border-radius: 4px;
            padding: 6.5px 75.5px;
        }
    </style>
</head>
<body>
    <img class="logo" src="images/_28be87a0-3009-46c2-a282-4a8ad507df1f.jpeg" alt="Indian Airlines Logo"/> 
    <h1 id="title">INDIAN AIRLINES</h1>
    
    <div>
        <ul>
            <li><a href="customer_homepage.php"><i class="fa fa-home" aria-hidden="true"></i> Home</a></li>
            <li><a href="customer_homepage.php"><i class="fa fa-desktop" aria-hidden="true"></i> Dashboard</a></li>
          
            <li><a href="logout_handler.php"><i class="fa fa-sign-out" aria-hidden="true"></i> Logout</a></li>
        </ul>
    </div>
    
    <?php
        echo "<h2>Welcome ".$_SESSION['login_user']."</h2>";
    ?>

    <table cellpadding="5">
        <tr>
            <td class="admin_func"><a href="book_tickets.php"><i class="fa fa-plane" aria-hidden="true"></i> Book Flight Tickets</a></td>
        </tr>
        <tr>
            <td class="admin_func"><a href="view_booked_tickets.php"><i class="fa fa-plane" aria-hidden="true"></i> View Booked Flight Tickets</a></td>
        </tr>
        <tr>
            <td class="admin_func"><a href="cancel_booked_tickets.php"><i class="fa fa-plane" aria-hidden="true"></i> Cancel Booked Flight Tickets</a></td>
        </tr>
        <tr>
            <td class="admin_func"><a href="customer_check_seat_availability.php"><i class="fa fa-plane" aria-hidden="true"></i> Check Seat Availability</a></td>
        </tr>
    </table>
</body>
</html>
