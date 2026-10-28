<?php
    session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cancel Booked Tickets</title>
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
        table {
            border-collapse: collapse; 
            margin: 20px auto;
            width: 60%;
            background-color: rgba(255, 255, 255, 0.8); /* Semi-transparent background */
            border-radius: 8px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #030337;
            color: white;
        }
        input {
            border: 1.5px solid #030337;
            border-radius: 4px;
            padding: 7px 30px;
            font-size: 14px;
        }
        input[type=submit] {
            background-color: #030337;
            color: white;
            border-radius: 4px;
            padding: 7px 45px;
            margin: 20px 0;
        }
        .fix_table {
            text-align: left;
            padding: 10px;
        }
        .error-message {
            color: red;
        }
    </style>
</head>
<body>
    <img class="logo" src="images/_28be87a0-3009-46c2-a282-4a8ad507df1f.jpeg" alt="Aadith Airlines Logo"/> 
    <h1 id="title">INDIAN AIRLINES</h1>
    <div>
        <ul>
            <li><a href="customer_homepage.php"><i class="fa fa-home" aria-hidden="true"></i> Home</a></li>
            <li><a href="customer_homepage.php"><i class="fa fa-desktop" aria-hidden="true"></i> Dashboard</a></li>
        </ul>
    </div>
    <form action="cancel_booked_tickets_form_handler.php" method="post">
        <h2>CANCEL BOOKED TICKETS</h2>
        <?php
            if(isset($_GET['msg']) && $_GET['msg']=='failed') {
                echo "<strong class='error-message'>*Invalid PNR, please enter PNR again</strong><br><br>";
            }
        ?>
        <table cellpadding="5">
            <tr>
                <td class="fix_table">Enter the PNR</td>
            </tr>
            <tr>
                <td class="fix_table"><input type="text" name="pnr" required></td>
            </tr>
        </table>
        <input type="submit" value="Cancel Ticket" name="Cancel_Ticket">
    </form>
</body>
</html>
