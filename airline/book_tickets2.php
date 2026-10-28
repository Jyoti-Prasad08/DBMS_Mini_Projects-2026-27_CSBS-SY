<?php
session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enter Travel/Ticket Details</title>
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
            max-width: 800px; /* Adjust width as needed */
            border-radius: 8px;
        }
        .logo {
            display: block;
            margin: 0 auto;
            width: 200px; /* Adjust size of the logo */
        }
        h1, h2 {
            text-align: center;
            color: #030337;
        }
        input, select {
            border: 1.5px solid #030337;
            border-radius: 4px;
            padding: 7px 10px;
            margin: 5px 0;
        }
        input[type=submit] {
            background-color: #030337;
            color: white;
            border-radius: 4px;
            padding: 10px 20px;
            margin: 20px 0;
            display: block;
            width: 100%;
            cursor: pointer;
        }
        input[type=radio] {
            margin-right: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        td, th {
            padding: 10px;
            border: solid thin #ddd;
            text-align: left;
        }
        th {
            background-color: #f4f4f4;
        }
        .fix_table_short {
            width: 20%;
        }
        .fix_table {
            text-align: center;
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
        <?php
        $no_of_pass = $_SESSION['no_of_pass'];
        $count = $_SESSION['count'];
        $flight_no = $_POST['select_flight'];
        $_SESSION['flight_no'] = $flight_no;
        echo "<h2>ADD PASSENGER DETAILS</h2>";
        echo "<form action=\"add_ticket_details_form_handler.php\" method=\"post\">";
        while ($count <= $no_of_pass) {
            echo "<p><strong>PASSENGER " . $count . "</strong></p>";
            echo "<table cellpadding=\"0\">";
            echo "<tr>";
            echo "<td class=\"fix_table_short\">Passenger's Name</td>";
            echo "<td class=\"fix_table_short\">Passenger's Age</td>";
            echo "<td class=\"fix_table_short\">Passenger's Gender</td>";
            echo "<td class=\"fix_table_short\">Passenger's Inflight Meal</td>";
            echo "</tr>";
            echo "<tr>";
            echo "<td class=\"fix_table_short\"><input type=\"text\" name=\"pass_name[]\" required></td>";
            echo "<td class=\"fix_table_short\"><input type=\"number\" name=\"pass_age[]\" required></td>";
            echo "<td class=\"fix_table_short\">";
            echo "<select name=\"pass_gender[]\">";
            echo "<option value=\"male\">Male</option>";
            echo "<option value=\"female\">Female</option>";
            echo "<option value=\"other\">Other</option>";
            echo "</select>";
            echo "</td>";
            echo "<td class=\"fix_table_short\">";
            echo "<select name=\"pass_meal[]\">";
            echo "<option value=\"yes\">Yes</option>";
            echo "<option value=\"no\">No</option>";
            echo "</select>";
            echo "</td>";
            echo "</tr>";
            echo "</table>";
            echo "<br><hr>";
            $count++;
        }
        echo "<br><h2>ENTER TRAVEL DETAILS</h2>";
        echo "<table cellpadding=\"5\">";
        echo "<tr>";
        echo "<td class=\"fix_table_short\">Do you want to purchase Travel Insurance?</td>";
        echo "</tr>";
        echo "<tr>";
        echo "<td class=\"fix_table\">";
        echo "Yes <input type='radio' name='insurance' value='yes' checked/> No <input type='radio' name='insurance' value='no'/>";
        echo "</td>";
        echo "</tr>";
        echo "</table>";
        echo "<br><br>";
        echo "<input type=\"submit\" value=\"Submit Travel/Ticket Details\" name=\"Submit\">";
        echo "</form>";
        ?>
    </div>
</body>
</html>
