<?php
session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enter Payment Details</title>
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
        h1, h2, h3 {
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
            margin: 20px auto;
            display: block;
            cursor: pointer;
        }
        input[type=radio] {
            margin-right: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 16px; /* Increased font size for table */
        }
        td, th {
            padding: 12px; /* Increased padding for better readability */
            border: solid thin #ddd;
            text-align: left;
            font-weight: bold; /* Bold text for table cells */
        }
        th {
            background-color: #f4f4f4;
            font-size: 18px; /* Increased font size for table headers */
        }
        .fix_table {
            text-align: left;
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
       
        <form action="payment_details_form_handler.php" method="post">
            <h2>ENTER THE PAYMENT DETAILS</h2>
            <h3><u>Payment Summary</u></h3>
            <?php
            $flight_no = $_SESSION['flight_no'];
            $journey_date = $_SESSION['journey_date'];
            $no_of_pass = $_SESSION['no_of_pass'];
            $total_no_of_meals = $_SESSION['total_no_of_meals'];
            $payment_id = rand(100000000, 999999999);
            $pnr = $_SESSION['pnr'];
            $_SESSION['payment_id'] = $payment_id;
            $payment_date = date('Y-m-d');
            $_SESSION['payment_date'] = $payment_date;

            require_once('Database Connection file/mysqli_connect.php');
            if ($_SESSION['class'] == 'economy') {
                $query = "SELECT price_economy FROM Flight_Details WHERE flight_no=? AND departure_date=?";
                $stmt = mysqli_prepare($dbc, $query);
                mysqli_stmt_bind_param($stmt, "ss", $flight_no, $journey_date);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_bind_result($stmt, $ticket_price);
                mysqli_stmt_fetch($stmt);
            } else if ($_SESSION['class'] == 'business') {
                $query = "SELECT price_business FROM Flight_Details WHERE flight_no=? AND departure_date=?";
                $stmt = mysqli_prepare($dbc, $query);
                mysqli_stmt_bind_param($stmt, "ss", $flight_no, $journey_date);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_bind_result($stmt, $ticket_price);
                mysqli_stmt_fetch($stmt);
            }
            mysqli_stmt_close($stmt);
            mysqli_close($dbc);

            $total_ticket_price = $no_of_pass * $ticket_price;
            $total_meal_price = 250 * $total_no_of_meals;
            $total_insurance_fee = ($_SESSION['insurance'] == 'yes') ? 100 * $no_of_pass : 0;

            $total_discount = 0;
            $total_amount = $total_ticket_price + $total_meal_price + $total_insurance_fee +  $total_discount;
            $_SESSION['total_amount'] = $total_amount;

            echo "<table cellpadding=\"5\">";
            echo "<tr>";
            echo "<td class=\"fix_table\">Ticket Price (Fees & Taxes included):</td>";
            echo "<td class=\"fix_table\">&#x20b9; " . $total_ticket_price . "</td>";
            echo "</tr>";

            echo "<tr>";
            echo "<td class=\"fix_table\">Meal Combo Charges:</td>";
            echo "<td class=\"fix_table\">&#x20b9; " . $total_meal_price . "</td>";
            echo "</tr>";

            echo "<tr>";
            echo "<td class=\"fix_table\">Insurance Fees:</td>";
            echo "<td class=\"fix_table\">&#x20b9; " . $total_insurance_fee . "</td>";
            echo "</tr>";

            echo "<tr>";
            echo "<td class=\"fix_table\">Discount:</td>";
            echo "<td class=\"fix_table\">&#x20b9; " . $total_discount . "</td>";
            echo "</tr>";

            echo "</table>";

            echo "<hr>";
            echo "<table cellpadding=\"5\">";
            echo "<tr>";
            echo "<td class=\"fix_table\"><strong>Total:</strong></td>";
            echo "<td class=\"fix_table\">&#x20b9; " . $total_amount . "</td>";
            echo "</tr>";
            echo "</table>";
            echo "<hr>";
            echo "<br>";
            echo "<p>Your Payment/Transaction ID is <strong>" . $payment_id . ".</strong> Please note it down for future reference.</p>";
            echo "<br>";
            ?>
            <table cellpadding="5">
                <tr>
                    <td class="fix_table"><strong>Enter the Payment Mode:</strong></td>
                </tr>
                <tr>
                    <td class="fix_table"><i class="fa fa-credit-card" aria-hidden="true"></i> Credit Card <input type="radio" name="payment_mode" value="credit card" checked></td>
                    <td class="fix_table"><i class="fa fa-credit-card-alt" aria-hidden="true"></i> Debit Card <input type="radio" name="payment_mode" value="debit card"></td>
                    <td class="fix_table"><i class="fa fa-desktop" aria-hidden="true"></i> Net Banking <input type="radio" name="payment_mode" value="net banking"></td>
                </tr>
            </table>
            <br>
            <input type="submit" value="Pay Now" name="Pay_Now">
        </form>
    </div>
</body>
</html>
