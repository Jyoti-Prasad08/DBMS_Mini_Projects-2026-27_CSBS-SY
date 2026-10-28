<?php
session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>View Available Flights</title>
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
        }
        .container {
            background-color: rgba(255, 255, 255, 0.9); /* Slightly opaque background for readability */
            padding: 20px;
            margin: 20px auto;
            max-width: 1200px; /* Adjust width as needed */
            border-radius: 8px;
        }
        .logo {
            display: block;
            margin: 0 auto;
            width: 200px; /* Adjust size of the logo */
        }
        h1 {
            color: #000;
            text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.8);
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
            margin: 10px auto;
            display: block;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px auto;
            background-color: #fff;
        }
        th, td {
            border: solid thin #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f4f4f4;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        ul {
            list-style-type: none;
            padding: 0;
            text-align: center;
        }
        ul li {
            display: inline;
            margin: 0 10px;
        }
        ul li a {
            color: #fff;
            text-decoration: none;
            padding: 5px 10px;
            background-color: #030337;
            border-radius: 4px;
        }
        ul li a:hover {
            background-color: #ddd;
            color: #000;
        }
    </style>
</head>
<body>
    <div class="container">
        <img class="logo" src="images/_28be87a0-3009-46c2-a282-4a8ad507df1f.jpeg" alt="Indian Airlines Logo"/> 
        <h1 id="title">INDIAN AIRLINES</h1>
        <div>
            <ul>
                <li><a href="home_page.php"><i class="fa fa-home" aria-hidden="true"></i> Home</a></li>
                <li><a href="customer_homepage.php"><i class="fa fa-desktop" aria-hidden="true"></i> Dashboard</a></li>
            </ul>
        </div>
        <h2>AVAILABLE FLIGHTS</h2>
        <?php
        if (isset($_POST['Search'])) {
            $data_missing = array();
            if (empty($_POST['origin'])) {
                $data_missing[] = 'Origin';
            } else {
                $origin = $_POST['origin'];
            }
            if (empty($_POST['destination'])) {
                $data_missing[] = 'Destination';
            } else {
                $destination = $_POST['destination'];
            }

            if (empty($_POST['dep_date'])) {
                $data_missing[] = 'Departure Date';
            } else {
                $dep_date = trim($_POST['dep_date']);
            }
            if (empty($_POST['no_of_pass'])) {
                $data_missing[] = 'No. of Passengers';
            } else {
                $no_of_pass = trim($_POST['no_of_pass']);
            }

            if (empty($_POST['class'])) {
                $data_missing[] = 'Class';
            } else {
                $class = trim($_POST['class']);
            }

            if (empty($data_missing)) {
                $_SESSION['no_of_pass'] = $no_of_pass;
                $_SESSION['class'] = $class;
                $count = 1;
                $_SESSION['count'] = $count;
                $_SESSION['journey_date'] = $dep_date;
                require_once('Database Connection file/mysqli_connect.php');
                if ($class == "economy") {
                    $query = "SELECT flight_no, from_city, to_city, departure_date, departure_time, arrival_date, arrival_time, price_economy 
                              FROM Flight_Details 
                              WHERE from_city=? AND to_city=? AND departure_date=? AND seats_economy>=? 
                              ORDER BY departure_time";
                    $stmt = mysqli_prepare($dbc, $query);
                    mysqli_stmt_bind_param($stmt, "sssi", $origin, $destination, $dep_date, $no_of_pass);
                    mysqli_stmt_execute($stmt);
                    mysqli_stmt_bind_result($stmt, $flight_no, $from_city, $to_city, $departure_date, $departure_time, $arrival_date, $arrival_time, $price_economy);
                    mysqli_stmt_store_result($stmt);
                    if (mysqli_stmt_num_rows($stmt) == 0) {
                        echo "<h3>No flights are available!</h3>";
                    } else {
                        echo "<form action=\"book_tickets2.php\" method=\"post\">";
                        echo "<table cellpadding=\"10\">";
                        echo "<tr>
                                <th>Flight No.</th>
                                <th>Origin</th>
                                <th>Destination</th>
                                <th>Departure Date</th>
                                <th>Departure Time</th>
                                <th>Arrival Date</th>
                                <th>Arrival Time</th>
                                <th>Price (Economy)</th>
                                <th>Select</th>
                              </tr>";
                        while (mysqli_stmt_fetch($stmt)) {
                            echo "<tr>
                                    <td>" . $flight_no . "</td>
                                    <td>" . $from_city . "</td>
                                    <td>" . $to_city . "</td>
                                    <td>" . $departure_date . "</td>
                                    <td>" . $departure_time . "</td>
                                    <td>" . $arrival_date . "</td>
                                    <td>" . $arrival_time . "</td>
                                    <td>&#x20b9; " . $price_economy . "</td>
                                    <td><input type=\"radio\" name=\"select_flight\" value=\"" . $flight_no . "\"></td>
                                  </tr>";
                        }
                        echo "</table> <br>";
                        echo "<input type=\"submit\" value=\"Select Flight\" name=\"Select\">";
                        echo "</form>";
                    }
                } else if ($class == "business") {
                    $query = "SELECT flight_no, from_city, to_city, departure_date, departure_time, arrival_date, arrival_time, price_business 
                              FROM Flight_Details 
                              WHERE from_city=? AND to_city=? AND departure_date=? AND seats_business>=? 
                              ORDER BY departure_time";
                    $stmt = mysqli_prepare($dbc, $query);
                    mysqli_stmt_bind_param($stmt, "sssi", $origin, $destination, $dep_date, $no_of_pass);
                    mysqli_stmt_execute($stmt);
                    mysqli_stmt_bind_result($stmt, $flight_no, $from_city, $to_city, $departure_date, $departure_time, $arrival_date, $arrival_time, $price_business);
                    mysqli_stmt_store_result($stmt);
                    if (mysqli_stmt_num_rows($stmt) == 0) {
                        echo "<h3>No flights are available!</h3>";
                    } else {
                        echo "<form action=\"book_tickets2.php\" method=\"post\">";
                        echo "<table cellpadding=\"10\">";
                        echo "<tr>
                                <th>Flight No.</th>
                                <th>Origin</th>
                                <th>Destination</th>
                                <th>Departure Date</th>
                                <th>Departure Time</th>
                                <th>Arrival Date</th>
                                <th>Arrival Time</th>
                                <th>Price (Business)</th>
                                <th>Select</th>
                              </tr>";
                        while (mysqli_stmt_fetch($stmt)) {
                            echo "<tr>
                                    <td>" . $flight_no . "</td>
                                    <td>" . $from_city . "</td>
                                    <td>" . $to_city . "</td>
                                    <td>" . $departure_date . "</td>
                                    <td>" . $departure_time . "</td>
                                    <td>" . $arrival_date . "</td>
                                    <td>" . $arrival_time . "</td>
                                    <td>&#x20b9; " . $price_business . "</td>
                                    <td><input type=\"radio\" name=\"select_flight\" value=\"" . $flight_no . "\"></td>
                                  </tr>";
                        }
                        echo "</table> <br>";
                        echo "<input type=\"submit\" value=\"Select Flight\" name=\"Select\">";
                        echo "</form>";
                    }
                }
                mysqli_stmt_close($stmt);
                mysqli_close($dbc);
            } else {
                echo "The following data fields were empty! <br>";
                foreach ($data_missing as $missing) {
                    echo $missing . "<br>";
                }
            }
        } else {
            echo "Search request not received";
        }
        ?>
    </div>
</body>
</html>
