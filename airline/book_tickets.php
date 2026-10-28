<?php
	session_start();
?>
<!DOCTYPE html>
<html>
<head>
    <title>View Available Flights</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
        }
        .container {
            background-color: rgba(255, 255, 255, 0.8);
            margin: 20px auto;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            width: 80%;
            text-align: center;
        }
        .logo {
            display: block;
            margin: 20px auto;
            width: 150px; /* Adjust size as needed */
            height: auto;
            border-radius: 50%;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        #title {
            color: #030337;
            font-size: 3em;
            margin: 10px 0;
            font-weight: 700;
            letter-spacing: 1.5px;
        }
        ul {
            list-style-type: none;
            padding: 0;
            margin: 0;
            background: linear-gradient(45deg, #030337, #575757);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border-radius: 8px;
        }
        ul li {
            display: inline;
        }
        ul li a {
            color: white;
            padding: 14px 20px;
            text-decoration: none;
            display: inline-block;
            transition: background-color 0.3s, color 0.3s;
            font-weight: bold;
        }
        ul li a:hover {
            background-color: #575757;
            color: #ffeb3b;
        }
        h2 {
            color: #444;
            font-size: 2em;
            margin: 20px 0;
        }
        table {
            margin: 40px auto;
            border-collapse: collapse;
            width: 100%;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            background-color: white;
            border-radius: 10px;
            overflow: hidden;
        }
        .fix_table {
            padding: 10px;
            text-align: center;
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
            margin: 0px 127px;
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
    <link rel="stylesheet" type="text/css" href="css/style.css"/>
    <link rel="stylesheet" href="font-awesome-4.7.0/css/font-awesome.min.css">
</head>
<body>
    <div class="container">
        <img class="logo" src="images/_28be87a0-3009-46c2-a282-4a8ad507df1f.jpeg" alt="JP Airlines Logo"/> 
        <h1 id="title">INDIAN AIRLINES</h1>
        <div>
            <ul>
                <li><a href="home_page.php"><i class="fa fa-home" aria-hidden="true"></i> Home</a></li>
                <li><a href="customer_homepage.php"><i class="fa fa-desktop" aria-hidden="true"></i> Dashboard</a></li>
               
            </ul>
        </div>
        <form action="view_flights_form_handler.php" method="post">
            <h2>SEARCH FOR AVAILABLE FLIGHTS</h2>
            <table cellpadding="5">
                <tr>
                    <td class="fix_table">Enter the Origin</td>
                    <td class="fix_table">Enter the Destination</td>
                </tr>
                <tr>
                    <td class="fix_table">
                        <input list="origins" name="origin" placeholder="From" required>
                        <datalist id="origins">
                            <option value="Bangalore">
                        </datalist>
                    </td>
                    <td class="fix_table">
                        <input list="destinations" name="destination" placeholder="To" required>
                        <datalist id="destinations">
                            <option value="Mumbai">
                            <option value="Mysore">
                            <option value="Mangalore">
                            <option value="Chennai">
                            <option value="Hyderabad">
                        </datalist>
                    </td>
                </tr>
            </table>
            <br>
            <table cellpadding="5">
                <tr>
                    <td class="fix_table">Enter the Departure Date</td>
                    <td class="fix_table">Enter the No. of Passengers</td>
                </tr>
                <tr>
                    <td class="fix_table"><input type="date" name="dep_date" min="<?php echo date('Y-m-d'); ?>" max="<?php echo date('Y-m-d', strtotime('+90 days')); ?>" required></td>
                    <td class="fix_table"><input type="number" name="no_of_pass" placeholder="Eg. 1" required></td>
                </tr>
            </table>
            <br>
            <table cellpadding="5">
                <tr>
                    <td class="fix_table">Enter the Class</td>
                </tr>
                <tr>
                    <td class="fix_table">
                        <select name="class">
                            <option value="economy">Economy</option>
                            <option value="business">Business</option>
                        </select>
                    </td>
                </tr>
            </table>
            <br>
            <input type="submit" value="Search for Available Flights" name="Search">
        </form>
    </div>
</body>
</html>
