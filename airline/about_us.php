
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About Us - INDIAN Airlines</title>
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

        .about-us {
            background-image: url('images/_54ad6a27-e0bb-42d4-9693-bd5482d4ca31.jpeg'); /* Set background image */
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            padding: 50px 0;
            text-align: center;
            color: #fff; /* Text color for better contrast */
        }

        .about-us h2 {
            font-size: 36px;
            margin-bottom: 20px;
        }

        .about-us p {
            font-size: 18px;
            line-height: 1.6;
            margin-bottom: 20px;
            background-color: rgba(0, 0, 0, 0.6); /* Add background color for better text readability */
            padding: 20px;
            border-radius: 10px;
            display: inline-block;
        }

        footer {
            background-color: #030337;
            color: #fff;
            text-align: center;
            padding: 10px 0;
            position: relative;
            margin-top: 20px;
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
                    <li><a href="login_page.php"><i class="fa fa-ticket" aria-hidden="true"></i> Book Tickets</a></li>
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
        </div>
    </header>

    <section class="about-us">
        <div class="container">
            <h2>About Us</h2>
            <p>Welcome to INDIAN Airlines, where we strive to provide the best in comfort, convenience, and customer service. Our mission is to make your journey as enjoyable as possible, with top-notch amenities, punctual departures, and a wide range of destinations. Our fleet of modern aircraft is maintained to the highest standards of safety and efficiency, ensuring a smooth and secure flight every time.</p>
            <p>INDIAN Airlines has been serving passengers for over 30 years, constantly innovating and expanding our services to meet the needs of our valued customers. We believe in providing a seamless travel experience, from easy online bookings to attentive in-flight service.</p>
            <p>Join us and discover why INDIAN Airlines is the preferred choice for travelers around the world.</p>
        </div>
    </section>

    <footer>
        <div class="container">
            <p>&copy; <?php echo date('Y'); ?> INDIAN Airlines. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>
