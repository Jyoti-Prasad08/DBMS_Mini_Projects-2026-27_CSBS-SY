<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to INDIAN Airlines</title>
    <link rel="stylesheet" type="text/css" href="css/style.css">
    <link rel="stylesheet" href="font-awesome-4.7.0/css/font-awesome.min.css">
    <style>
        /* Reset default styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        /* Basic styling */
        body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            color: #333;
        }

        .container {
            width: 80%;
            margin: 0 auto;
            padding: 20px;
        }

        header {
            background-color: #030337;
            color: #fff;
            padding: 10px 0;
            position: relative;
        }

        header .logo {
            width: 60px;
            height: auto;
            margin-right: 10px;
        }

        header #title {
            display: inline;
            font-size: 32px;
            font-weight: bold;
            vertical-align: middle;
            color: orange; /* Set text color to orange */
        }

        nav ul {
            list-style-type: none;
            margin: 0;
            padding: 0;
            text-align: right; /* Align navigation items to the right */
        }

        nav ul li {
            display: inline-block;
            margin-right: 20px;
        }

        nav ul li a {
            color: #fff;
            text-decoration: none;
            padding: 10px;
        }

        nav ul li a:hover {
            background-color: #E7E7F6;
            color: #030337;
        }

        .welcome {
            background-image: url('images/_54ad6a27-e0bb-42d4-9693-bd5482d4ca31.jpeg');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            padding: 200px 0; /* Adjust padding as needed */
            text-align: center;
            color: #fff; /* Text color for better contrast */
        }

        .welcome h2 {
            font-size: 36px;
            margin-bottom: 20px;
        }

        .welcome p {
            text-transform: uppercase; /* Transform text to uppercase */
            font-size: 18px; /* Example: Adjust font size */
            color: orange; /* Set text color to orange */
            font-weight: bold; /* Example: Set text to bold */
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3); /* Add text shadow for 3D effect */
            display: inline-block; /* Ensure inline display for text shadow */
        }

        footer {
            background-color: #030337;
            color: #fff;
            text-align: center;
            padding: 10px 0;
            position: relative;
            margin-top: 20px;
        }

        .admin-login {
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 14px;
        }

        .admin-login a {
            color: #fff;
            text-decoration: none;
            background-color: #02436C;
            padding: 5px 10px;
            border-radius: 4px;
        }

        .admin-login a:hover {
            background-color: #030337;
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <img class="logo" src="images/_28be87a0-3009-46c2-a282-4a8ad507df1f.jpeg" alt="Airline Logo">
            <h1 id="title">INDIAN AIRLINES</h1>
            <nav>
                <ul>
                    <li><a href="home_page.php"><i class="fa fa-home" aria-hidden="true"></i> Home</a></li>
                    <li>
                        <?php if(isset($_SESSION['login_user']) && $_SESSION['user_type'] == 'Customer'): ?>
                            <a href="login_page.php"><i class="fa fa-ticket" aria-hidden="true"></i> Book Tickets</a>
                        <?php elseif(isset($_SESSION['login_user']) && $_SESSION['user_type'] == 'Administrator'): ?>
                            <a href="admin_ticket_message.php"><i class="fa fa-ticket" aria-hidden="true"></i> Book Tickets</a>
                        <?php else: ?>
                            <a href="login_page.php"><i class="fa fa-ticket" aria-hidden="true"></i> Book Tickets</a>
                        <?php endif; ?>
                    </li>
                    <li><a href="about_us.php"><i class="fa fa-plane" aria-hidden="true"></i> About Us</a></li>
                    <li><a href="contact_us.php"><i class="fa fa-phone" aria-hidden="true"></i> Contact Us</a></li>
                    <li>
                        <?php if(isset($_SESSION['login_user'])): ?>
                            <?php if($_SESSION['user_type'] == 'Customer'): ?>
                                <a href="customer_homepage.php"><i class="fa fa-sign-in" aria-hidden="true"></i> Profile</a>
                            <?php elseif($_SESSION['user_type'] == 'Administrator'): ?>
                                <a href="admin_homepage.php"><i class="fa fa-sign-in" aria-hidden="true"></i> Dashboard</a>
                            <?php endif; ?>
                        <?php else: ?>
                            <a href="login_page.php"><i class="fa fa-sign-in" aria-hidden="true"></i> Login</a>
                        <?php endif; ?>
                    </li>
                </ul>
            </nav>
            <div class="admin-login">
                <a href="admin_login_page.php"><i class="fa fa-lock" aria-hidden="true"></i> Admin Login</a>
            </div>
        </div>
    </header>

    <section class="welcome">
        <div class="container">
            <h2>Welcome to INDIAN Airlines!</h2>
            <p class="small-text">Enjoy your journey with us.</p>
        </div>
    </section>

    <footer>
        <div class="container">
            <p>&copy; <?php echo date('Y'); ?> INDIAN Airlines. All rights reserved.</p>
        </div>
    </footer>

</body>
</html>
