import client from "../../db.js";

/**
 * Get user analytics
 * Calculates real-time stats from database
 */
export const getUserAnalytics = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id;

    // Get user data
    const user = await client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Calculate analytics in parallel for speed
    const [
      postsCount,
      totalPostReviews,
      connectionsCount,
      sentConnectionsCount,
      receivedConnectionsCount,
      messagesCount,
      notificationsCount,
      postsData
    ] = await Promise.all([
      // Total posts by user
      client.post.count({
        where: { authorId: userId, isActive: true }
      }),
      
      // Total reviews on user's posts
      client.postReview.count({
        where: {
          post: {
            authorId: userId,
            isActive: true
          }
        }
      }),
      
      // Total connections (accepted)
      client.connection.count({
        where: {
          OR: [
            { senderId: userId, status: 'ACCEPTED' },
            { receiverId: userId, status: 'ACCEPTED' }
          ]
        }
      }),
      
      // Sent connections
      client.connection.count({
        where: { senderId: userId }
      }),
      
      // Received connections
      client.connection.count({
        where: { receiverId: userId }
      }),
      
      // Messages sent
      client.message.count({
        where: { senderId: userId }
      }),
      
      // Notifications received
      client.notification.count({
        where: { userId }
      }),
      
      // Posts with engagement data
      client.post.findMany({
        where: { authorId: userId, isActive: true },
        select: {
          id: true,
          averageRating: true,
          totalReviews: true,
          shares: true,
          createdAt: true
        }
      })
    ]);

    // Calculate post impressions (total reviews across all posts)
    const postImpressions = postsData.reduce((sum, post) => sum + (post.totalReviews || 0), 0);
    
    // Calculate total shares
    const totalShares = postsData.reduce((sum, post) => sum + (post.shares || 0), 0);
    
    // Calculate average rating across all posts
    const postsWithRatings = postsData.filter(p => p.averageRating > 0);
    const averageRating = postsWithRatings.length > 0
      ? postsWithRatings.reduce((sum, post) => sum + post.averageRating, 0) / postsWithRatings.length
      : 0;

    // Profile views (simulated based on connections + notifications)
    // In a real app, you'd track actual profile views
    const profileViews = connectionsCount * 3 + notificationsCount;

    // Search appearances (simulated based on posts and connections)
    const searchAppearances = postsCount * 2 + connectionsCount;

    // Calculate growth (posts in last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [recentPosts, previousPosts] = await Promise.all([
      client.post.count({
        where: {
          authorId: userId,
          isActive: true,
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      client.post.count({
        where: {
          authorId: userId,
          isActive: true,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
        }
      })
    ]);

    const growthPercentage = previousPosts > 0
      ? ((recentPosts - previousPosts) / previousPosts * 100).toFixed(1)
      : recentPosts > 0 ? 100 : 0;

    // Build analytics response
    const analytics = {
      overview: {
        profileViews,
        postImpressions,
        searchAppearances,
        growthPercentage: parseFloat(growthPercentage)
      },
      content: {
        totalPosts: postsCount,
        totalReviews: totalPostReviews,
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalShares
      },
      engagement: {
        connections: connectionsCount,
        sentConnections: sentConnectionsCount,
        receivedConnections: receivedConnectionsCount,
        messages: messagesCount,
        notifications: notificationsCount
      },
      activity: {
        postsLast30Days: recentPosts,
        postsPrevious30Days: previousPosts,
        accountAge: Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)) // days
      }
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error("Analytics error:", error);
    next(error);
  }
};
