<?php
    session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>View Booked Tickets</title>
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
        h3.set_nice_size {
            font-size: 17pt;
            text-decoration: underline;
            margin: 20px 0;
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
            border-collapse: collapse; 
            margin: 20px auto;
            width: 80%;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
        }
        th {
            background-color: #030337;
            color: white;
        }
        .set_nice_size {
            font-size: 17pt;
            text-decoration: underline;
            margin: 20px 0;
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
    <h2>VIEW BOOKED FLIGHT TICKETS</h2>
    <h3 class='set_nice_size'>Upcoming Trips</h3>
    <?php
        $todays_date = date('Y-m-d');
        $thirty_days_before_date = date_create(date('Y-m-d'));
        date_sub($thirty_days_before_date, date_interval_create_from_date_string("30 days")); 
        $thirty_days_before_date = date_format($thirty_days_before_date, "Y-m-d");
        
        $customer_id = $_SESSION['login_user'];
        require_once('Database Connection file/mysqli_connect.php');
        
        // Query for upcoming trips
        $query = "
            SELECT t.pnr, t.date_of_reservation, t.flight_no, t.journey_date, t.class, t.booking_status, 
                   t.no_of_passengers, t.payment_id, c.name 
            FROM Ticket_Details t 
            JOIN Customer c ON t.customer_id = c.customer_id
            WHERE t.customer_id = ? AND t.journey_date >= ? AND t.booking_status = 'CONFIRMED'
            ORDER BY t.journey_date
        ";
        $stmt = mysqli_prepare($dbc, $query);
        mysqli_stmt_bind_param($stmt, "ss", $customer_id, $todays_date);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_bind_result($stmt, $pnr, $date_of_reservation, $flight_no, $journey_date, $class, $booking_status, $no_of_passengers, $payment_id, $name);
        mysqli_stmt_store_result($stmt);
        
        if (mysqli_stmt_num_rows($stmt) == 0) {
            echo "<h3>No upcoming trips!</h3>";
        } else {
            echo "<table cellpadding=\"10\">";
            echo "<tr>
                    <th>Customer_id</th>
                    <th>PNR</th>
                    <th>Date of Reservation</th>
                    <th>Flight No.</th>
                    <th>Journey Date</th>
                    <th>Class</th>
                    <th>Booking Status</th>
                    <th>No. of Passengers</th>
                    <th>Payment ID</th>
                  </tr>";
            while (mysqli_stmt_fetch($stmt)) {
                echo "<tr>
                        <td>".$name."</td>
                        <td>".$pnr."</td>
                        <td>".$date_of_reservation."</td>
                        <td>".$flight_no."</td>
                        <td>".$journey_date."</td>
                        <td>".$class."</td>
                        <td>".$booking_status."</td>
                        <td>".$no_of_passengers."</td>
                        <td>".$payment_id."</td>
                      </tr>";
            }
            echo "</table><br>";
        }
        echo "<h3 class=\"set_nice_size\">Completed Trips</h3>";

        // Query for completed trips
        $query = "
            SELECT t.pnr, t.date_of_reservation, t.flight_no, t.journey_date, t.class, t.booking_status, 
                   t.no_of_passengers, t.payment_id, c.name 
            FROM Ticket_Details t 
            JOIN Customer c ON t.customer_id = c.customer_id
            WHERE t.customer_id = ? AND t.journey_date < ? AND t.journey_date >= ?
            ORDER BY t.journey_date
        ";
        $stmt = mysqli_prepare($dbc, $query);
        mysqli_stmt_bind_param($stmt, "sss", $customer_id, $todays_date, $thirty_days_before_date);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_bind_result($stmt, $pnr, $date_of_reservation, $flight_no, $journey_date, $class, $booking_status, $no_of_passengers, $payment_id, $name);
        mysqli_stmt_store_result($stmt);
        
        if (mysqli_stmt_num_rows($stmt) == 0) {
            echo "<h3>No trips completed in the past 30 days!</h3>";
        } else {
            echo "<table cellpadding=\"10\">";
            echo "<tr>
                    <th>Customer_id</th>
                    <th>PNR</th>
                    <th>Date of Reservation</th>
                    <th>Flight No.</th>
                    <th>Journey Date</th>
                    <th>Class</th>
                    <th>Booking Status</th>
                    <th>No. of Passengers</th>
                    <th>Payment ID</th>
                  </tr>";
            while (mysqli_stmt_fetch($stmt)) {
                echo "<tr>
                        <td>".$name."</td>
                        <td>".$pnr."</td>
                        <td>".$date_of_reservation."</td>
                        <td>".$flight_no."</td>
                        <td>".$journey_date."</td>
                        <td>".$class."</td>
                        <td>".$booking_status."</td>
                        <td>".$no_of_passengers."</td>
                        <td>".$payment_id."</td>
                      </tr>";
            }
            echo "</table><br>";
        }
        mysqli_stmt_close($stmt);
        mysqli_close($dbc);
    ?>
</body>
</html>
